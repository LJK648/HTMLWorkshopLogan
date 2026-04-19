const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3001;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://verntabase_user:R9lGnsXnYqaulsYEwrvA9lC1Q2aPccPP@dpg-d7f3t8kvikkc73dgbrh0-a.virginia-postgres.render.com/verntabase';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        items JSONB DEFAULT '[]',
        total NUMERIC DEFAULT 0,
        status TEXT DEFAULT 'pending',
        game_name TEXT,
        sport TEXT,
        date_time TIMESTAMP,
        location TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS hall_of_fame (
        id SERIAL PRIMARY KEY,
        player_name TEXT NOT NULL,
        score INTEGER,
        game_id INTEGER REFERENCES games(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        members JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        sports JSONB DEFAULT '[]',
        sport_positions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = { id: 'VB-' + Date.now(), status: 'pending', ...req.body };
    await pool.query(
      'INSERT INTO orders (id, customer_id, items, total, status, game_name, sport, date_time, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [newOrder.id, newOrder.customerId, JSON.stringify(newOrder.items || []), newOrder.total || 0, newOrder.status, newOrder.gameName, newOrder.sport, newOrder.dateTime, newOrder.location]
    );
    io.emit('orders_updated');
    res.json({ success: true, orderId: newOrder.id });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = result.rows.map(row => ({
      id: row.id, customerId: row.customer_id, items: row.items,
      total: row.total, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
      gameName: row.game_name, sport: row.sport, dateTime: row.date_time, location: row.location
    }));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/approve', async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', req.params.id]);
    io.emit('orders_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/orders/:id/decline', async (req, res) => {
  try {
    await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['declined', req.params.id]);
    io.emit('orders_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    io.emit('orders_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { fullName, email, sports, sportPositions } = req.body;
    if (!fullName || !email || !sports || sports.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await pool.query(
      'INSERT INTO players (full_name, email, sports, sport_positions) VALUES ($1, $2, $3, $4) RETURNING *',
      [fullName, email, JSON.stringify(sports), JSON.stringify(sportPositions)]
    );
    io.emit('players_updated');
    res.json({ success: true, player: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at DESC');
    const players = result.rows.map(row => ({
      id: row.id, fullName: row.full_name, email: row.email,
      sports: row.sports, sportPositions: row.sport_positions, createdAt: row.created_at
    }));
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM players WHERE id = $1', [req.params.id]);
    io.emit('players_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { teamName, sport, players } = req.body;
    if (!teamName || !sport || !players || players.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await pool.query(
      'INSERT INTO teams (name, members) VALUES ($1, $2) RETURNING id, name, members, created_at, updated_at',
      [teamName, JSON.stringify({ sport, players })]
    );
    const row = result.rows[0];
    io.emit('teams_updated');
    res.json({ success: true, team: { id: row.id, teamName: row.name, ...row.members, createdAt: row.created_at } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams ORDER BY created_at DESC');
    const teams = result.rows.map(row => {
      const members = row.members || {};
      return { id: row.id, teamId: row.id, teamName: row.name, sport: members.sport, players: members.players || [], createdAt: row.created_at };
    });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const { players, sport } = req.body;
    const result = await pool.query(
      'UPDATE teams SET members = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify({ sport, players }), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Team not found' });
    io.emit('teams_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    io.emit('teams_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ PostgreSQL connected successfully');
    await initializeDatabase();
    server.listen(PORT, () => {
      console.log(`✓ Vernball server running on port ${PORT}`);
      console.log(`✓ Database: PostgreSQL on Render`);
    });
  } catch (err) {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
