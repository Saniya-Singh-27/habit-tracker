const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'habittracker.db');
console.log('Testing connection to local DB:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.log('Database file does not exist, creating...');
    fs.closeSync(fs.openSync(dbPath, 'w'));
}

const db = new sqlite3.Database(dbPath);

async function test() {
    db.get('SELECT 1 as val', (err, row) => {
        if (err) {
            console.error('Connection failed:', err.message);
        } else {
            console.log('Connection successful! Value:', row.val);
        }
        db.close();
    });
}

test();
