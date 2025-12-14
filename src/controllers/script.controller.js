
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Get all scripts
exports.getAllScripts = async (req, res) => {
    try {
        const scripts = await prisma.script.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Add full URLs for image and file
        const scriptsWithUrl = scripts.map(script => ({
            ...script,
            imageUrl: script.imageUrl ? `${BACKEND_URL}/${script.imageUrl}` : null,
            fileUrl: script.fileUrl ? (script.fileUrl.startsWith('http') ? script.fileUrl : `${BACKEND_URL}/${script.fileUrl}`) : null
        }));

        res.json(scriptsWithUrl);
    } catch (error) {
        console.error('Get scripts error:', error);
        res.status(500).json({ error: 'Failed to fetch scripts' });
    }
};

// Create script (Admin)
exports.createScript = async (req, res) => {
    try {
        const { title, description, category, scriptType, price, version, fileUrl } = req.body;

        // Handle uploaded files
        let imageUrl = null;
        let scriptFileUrl = fileUrl || null; // Use provided URL as fallback

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                imageUrl = req.files.image[0].path.replace(/\\/g, '/');
            }
            if (req.files.scriptFile && req.files.scriptFile[0]) {
                scriptFileUrl = req.files.scriptFile[0].path.replace(/\\/g, '/');
            }
        }

        const script = await prisma.script.create({
            data: {
                title,
                description,
                category,
                scriptType: scriptType || 'SINGLE',
                price: parseFloat(price) || 0,
                version,
                fileUrl: scriptFileUrl,
                imageUrl
            }
        });

        res.status(201).json({
            ...script,
            imageUrl: script.imageUrl ? `${BACKEND_URL}/${script.imageUrl}` : null,
            fileUrl: script.fileUrl ? `${BACKEND_URL}/${script.fileUrl}` : null
        });
    } catch (error) {
        console.error('Create script error:', error);
        res.status(500).json({ error: 'Failed to create script' });
    }
};

// Update script (Admin)
exports.updateScript = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, price, version, fileUrl } = req.body;

        const script = await prisma.script.findUnique({ where: { id } });
        if (!script) return res.status(404).json({ error: 'Script not found' });

        let updateData = {
            title,
            description,
            category,
            price: price ? parseFloat(price) : undefined,
            version
        };

        // Handle file uploads
        if (req.files) {
            // New image uploaded
            if (req.files.image && req.files.image[0]) {
                updateData.imageUrl = req.files.image[0].path.replace(/\\/g, '/');
                // Delete old image
                if (script.imageUrl) {
                    const oldPath = path.join(__dirname, '../..', script.imageUrl);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            }
            // New script file uploaded
            if (req.files.scriptFile && req.files.scriptFile[0]) {
                updateData.fileUrl = req.files.scriptFile[0].path.replace(/\\/g, '/');
                // Delete old file
                if (script.fileUrl && !script.fileUrl.startsWith('http')) {
                    const oldPath = path.join(__dirname, '../..', script.fileUrl);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            }
        } else if (fileUrl) {
            updateData.fileUrl = fileUrl;
        }

        // Handle explicit image removal
        if (req.body.removeImage === 'true') {
            // Delete old image if exists
            if (script.imageUrl) {
                const oldPath = path.join(__dirname, '../..', script.imageUrl);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete old image:', e); }
                }
            }
            updateData.imageUrl = null;
        }

        const updatedScript = await prisma.script.update({
            where: { id },
            data: updateData
        });

        res.json({
            ...updatedScript,
            imageUrl: updatedScript.imageUrl ? `${BACKEND_URL}/${updatedScript.imageUrl}` : null,
            fileUrl: updatedScript.fileUrl ? (updatedScript.fileUrl.startsWith('http') ? updatedScript.fileUrl : `${BACKEND_URL}/${updatedScript.fileUrl}`) : null
        });
    } catch (error) {
        console.error('Update script error:', error);
        res.status(500).json({ error: 'Failed to update script' });
    }
};

// Delete script (Admin)
exports.deleteScript = async (req, res) => {
    try {
        const { id } = req.params;

        const script = await prisma.script.findUnique({
            where: { id },
            include: {
                licenses: true,
                orders: true
            }
        });
        if (!script) return res.status(404).json({ error: 'Script not found' });

        // Delete image file
        if (script.imageUrl) {
            const imagePath = path.join(__dirname, '../..', script.imageUrl);
            if (fs.existsSync(imagePath)) {
                try { fs.unlinkSync(imagePath); } catch (e) { console.log('Could not delete image file'); }
            }
        }

        // Delete script file
        if (script.fileUrl && !script.fileUrl.startsWith('http')) {
            const filePath = path.join(__dirname, '../..', script.fileUrl);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { console.log('Could not delete script file'); }
            }
        }

        // Delete related audit logs first (they reference licenses)
        for (const license of script.licenses) {
            await prisma.auditLog.deleteMany({
                where: { licenseId: license.id }
            });
        }

        // Delete related licenses
        await prisma.license.deleteMany({
            where: { scriptId: id }
        });

        // Delete related orders (set scriptId to null since it's optional)
        await prisma.order.updateMany({
            where: { scriptId: id },
            data: { scriptId: null }
        });

        // Now delete the script
        await prisma.script.delete({ where: { id } });

        res.json({ message: 'Script deleted successfully' });
    } catch (error) {
        console.error('Delete script error:', error);
        res.status(500).json({ error: 'Failed to delete script: ' + error.message });
    }
};
