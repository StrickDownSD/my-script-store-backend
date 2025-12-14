const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrationSql = fs.readFileSync(path.join(__dirname, '../migration.sql'), 'utf8');

// Parse DATABASE_URL for pg client
// If using pooler on 6543, we might need SSL
const connectionString = process.env.DATABASE_URL;

console.log('Connecting to database...');
console.log('URL:', connectionString.replace(/:[^:@]*@/, ':****@')); // masking password

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function applyMigration() {
    try {
        await client.connect();
        console.log('Connected successfully!');

        console.log('Applying migration...');

        // Split by semicolon? No, pg driver can execute multiple statements? 
        // Simple 'query' might execute multiple statements if they are in one string.

        await client.query(migrationSql);

        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error(err);
    } finally {
        await client.end();
    }
}

applyMigration();
