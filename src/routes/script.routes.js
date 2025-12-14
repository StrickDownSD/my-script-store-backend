
const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/script.controller');
const authenticateToken = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/admin.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Different directories for images and script files
        let uploadDir = 'uploads/';
        if (file.fieldname === 'scriptFile') {
            uploadDir = 'uploads/scripts/';
        } else if (file.fieldname === 'image') {
            uploadDir = 'uploads/images/';
        }

        // Create dir if not exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload middleware for both image and script file
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'scriptFile', maxCount: 1 }
]);

// Public Routes
router.get('/', scriptController.getAllScripts);

// Admin Routes (Protected)
router.post('/', authenticateToken, isAdmin, uploadFields, scriptController.createScript);
router.put('/:id', authenticateToken, isAdmin, uploadFields, scriptController.updateScript);
router.delete('/:id', authenticateToken, isAdmin, scriptController.deleteScript);

module.exports = router;
