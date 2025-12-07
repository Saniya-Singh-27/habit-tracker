const express = require('express');
const cookieSession = require('cookie-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Database Tables
async function initDB() {
  try {
    await db.execute('PRAGMA foreign_keys = ON');
    await db.execute(
      'CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)'
    );
    await db.execute(
      'CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, frequency TEXT, reminder_time TEXT, archived INTEGER DEFAULT 0, created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)'
    );
    await db.execute(
      'CREATE TABLE IF NOT EXISTS habit_entries (id TEXT PRIMARY KEY, habit_id TEXT NOT NULL, user_id TEXT NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)'
    );
    await db.execute(
      'CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, habit_title TEXT, message TEXT, scheduled_time TEXT, created_at TEXT NOT NULL, read INTEGER DEFAULT 0, expo_notification_id TEXT, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)'
    );
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

// Run initDB on startup
initDB();

// CORS MUST BE FIRST

const DEV_CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:8081';
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || DEV_CLIENT_ORIGIN);
  },
  credentials: true
}));

app.use(express.json());

app.use(
  cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'dev_secret_change_me'],
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'unauthorized' });
  }
}

app.get('/api/status', async (req, res) => {
  try {
    const result = await db.execute('SELECT COUNT(*) as count FROM users');
    const row = result.rows[0];
    res.json({ initialized: true, userCount: row ? row.count : 0 });
  } catch (err) {
    res.json({ initialized: true, userCount: 0 });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const normalizedEmail = String(email).toLowerCase();

  try {
    const existingResult = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [normalizedEmail]
    });

    if (existingResult.rows.length > 0) {
      res.status(409).json({ error: 'email_exists' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: 'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, normalizedEmail, name.trim(), hash, createdAt]
    });

    req.session.userId = id;
    res.status(201).json({ id, email: normalizedEmail, name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const normalizedEmail = String(email).toLowerCase();

  try {
    const result = await db.execute({
      sql: 'SELECT id, email, name, password_hash FROM users WHERE email = ?',
      args: [normalizedEmail]
    });

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'user_not_found' });
      return;
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      res.status(401).json({ error: 'invalid_password' });
      return;
    }

    req.session.userId = row.id;
    res.json({ id: row.id, email: row.email, name: row.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const result = await db.execute({
      sql: 'SELECT id, email, name FROM users WHERE id = ?',
      args: [req.session.userId]
    });
    const row = result.rows[0];
    if (!row) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/habits', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM habits WHERE user_id = ? AND archived = 0 ORDER BY created_at DESC',
      args: [req.session.userId]
    });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/habits', requireAuth, async (req, res) => {
  const { title, description, frequency, reminder_time } = req.body;
  if (!title) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await db.execute({
      sql: 'INSERT INTO habits (id, user_id, title, description, frequency, reminder_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, req.session.userId, title, description || null, frequency || null, reminder_time || null, createdAt]
    });
    res.status(201).json({ id, user_id: req.session.userId, title, description: description || null, frequency: frequency || null, reminder_time: reminder_time || null, archived: 0, created_at: createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.put('/api/habits/:id', requireAuth, async (req, res) => {
  const { title, description, frequency, reminder_time, archived } = req.body;
  try {
    await db.execute({
      sql: 'UPDATE habits SET title = COALESCE(?, title), description = COALESCE(?, description), frequency = COALESCE(?, frequency), reminder_time = COALESCE(?, reminder_time), archived = COALESCE(?, archived) WHERE id = ? AND user_id = ?',
      args: [title || null, description || null, frequency || null, reminder_time || null, typeof archived === 'number' ? archived : null, req.params.id, req.session.userId]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.delete('/api/habits/:id', requireAuth, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM habits WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.session.userId]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/habits/:id/entries', requireAuth, async (req, res) => {
  const { date, status } = req.body;
  if (!date || !status) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await db.execute({
      sql: 'INSERT INTO habit_entries (id, habit_id, user_id, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, req.params.id, req.session.userId, date, status, createdAt]
    });
    res.status(201).json({ id, habit_id: req.params.id, user_id: req.session.userId, date, status, created_at: createdAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/habits/:id/entries', requireAuth, async (req, res) => {
  const { start, end } = req.query;
  const params = [req.params.id, req.session.userId];
  let whereDate = '';
  if (start && end) {
    whereDate = ' AND date >= ? AND date <= ?';
    params.push(start);
    params.push(end);
  }
  const sql = 'SELECT * FROM habit_entries WHERE habit_id = ? AND user_id = ?' + whereDate + ' ORDER BY date DESC';

  try {
    const result = await db.execute({ sql, args: params });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/stats/weekly', requireAuth, async (req, res) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = now.toISOString().slice(0, 10);

  try {
    const result = await db.execute({
      sql: 'SELECT date, status FROM habit_entries WHERE user_id = ? AND date >= ? AND date <= ?',
      args: [req.session.userId, startStr, endStr]
    });
    const rows = result.rows;

    const map = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      map.set(d.toISOString().slice(0, 10), { completed: 0, total: 0 });
    }
    rows.forEach(r => {
      const key = r.date;
      if (!map.has(key)) map.set(key, { completed: 0, total: 0 });
      const v = map.get(key);
      v.total += 1;
      if (String(r.status).toLowerCase() === 'completed') v.completed += 1;
      map.set(key, v);
    });
    let totalCompleted = 0;
    let streak = 0;
    let currentStreak = 0;
    const values = Array.from(map.values());
    values.forEach((v, idx) => {
      totalCompleted += v.completed;
      if (v.completed > 0) {
        streak += 1;
        if (idx === values.length - 1) currentStreak = streak;
      } else {
        streak = 0;
      }
    });
    const progress = values.reduce((acc, v) => acc + (v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0), 0);
    const avgProgress = values.length > 0 ? Math.round(progress / values.length) : 0;
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = values.map(v => v.completed);
    res.json({ totalHabitsCompleted: totalCompleted, currentStreak, progress: avgProgress, chart: { labels, datasets: [{ data: counts }] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.session.userId]
    });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/notifications', requireAuth, async (req, res) => {
  const { habitTitle, message, scheduledTime, expoNotificationId } = req.body;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await db.execute({
      sql: 'INSERT INTO notifications (id, user_id, habit_title, message, scheduled_time, created_at, read, expo_notification_id) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      args: [id, req.session.userId, habitTitle || null, message || null, scheduledTime || null, createdAt, expoNotificationId || null]
    });
    res.status(201).json({ id, user_id: req.session.userId, habit_title: habitTitle || null, message: message || null, scheduled_time: scheduledTime || null, created_at: createdAt, read: 0, expo_notification_id: expoNotificationId || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    await db.execute({
      sql: 'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.session.userId]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
  try {
    await db.execute({
      sql: 'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.session.userId]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
