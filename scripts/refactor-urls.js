
const fs = require('fs');
const path = require('path');

const CLIENT_DIR = path.join(__dirname, '../../client');
const API_URL_IMPORT = "import { API_URL } from '@/config/api';";

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                filelist = walkSync(dirFile, filelist);
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                filelist.push(dirFile);
            }
        }
    });
    return filelist;
}

const files = walkSync(CLIENT_DIR);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Regex to find http://localhost:5000/api...
    // Matches: 'http://localhost:5000/api/endpoint' or `http://localhost:5000/api/endpoint`
    // We want to replace valid fetch URLs.

    if (content.includes('localhost:5000')) {
        // Add import if not present
        if (!content.includes(API_URL_IMPORT) && !file.includes('config/api.ts')) {
            // Find last import or top of file
            const lastImport = content.lastIndexOf('import ');
            if (lastImport !== -1) {
                const endOfImportVals = content.indexOf(';', lastImport);
                // Simple prepend to file is safer generally, or after 'use client'
                if (content.startsWith("'use client'")) {
                    content = content.replace("'use client';", "'use client';\n" + API_URL_IMPORT);
                } else {
                    content = API_URL_IMPORT + '\n' + content;
                }
            } else {
                content = API_URL_IMPORT + '\n' + content;
            }
        }

        // Replace variants
        // 1. Template literal: `http://localhost:5000/api/${id}` -> `${API_URL}/${id}`
        content = content.replace(/`http:\/\/localhost:5000\/api/g, '`${API_URL}');

        // 2. String literal: 'http://localhost:5000/api/scripts' -> `${API_URL}/scripts`
        // We need to change the string to a template literal if it's not already
        content = content.replace(/'http:\/\/localhost:5000\/api([^']*)'/g, '`${API_URL}$1`');
        content = content.replace(/"http:\/\/localhost:5000\/api([^"]*)"/g, '`${API_URL}$1`');

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            console.log(`Updated ${file}`);
            count++;
        }
    }
});

console.log(`Modified ${count} files.`);
