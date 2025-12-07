const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database file exists in the project root
const dbPath = path.join(__dirname, '..', 'habittracker.db');
if (!fs.existsSync(dbPath)) {
    // Create an empty file if it doesn't exist
    fs.closeSync(fs.openSync(dbPath, 'w'));
}

const db = new sqlite3.Database(dbPath);

/**
 * Executes a SQL statement.
 * Accepts either a raw SQL string (no parameters) or an object { sql, args }.
 * Returns a Promise resolving to an object with a `rows` array, matching the libsql client interface.
 */
function execute(query) {
    return new Promise((resolve, reject) => {
        let sql, args = [];
        if (typeof query === 'string') {
            sql = query;
        } else if (query && typeof query.sql === 'string') {
            sql = query.sql;
            args = query.args || [];
        } else {
            return reject(new Error('Invalid query format for execute'));
        }
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT')) {
            db.all(sql, args, (err, rows) => {
                if (err) return reject(err);
                resolve({ rows });
            });
        } else {
            db.run(sql, args, function (err) {
                if (err) return reject(err);
                // libsql returns an empty rows array for non-select statements
                resolve({ rows: [] });
            });
        }
    });
}

module.exports = { execute };
