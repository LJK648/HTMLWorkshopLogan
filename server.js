const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL connection (using Render database URL)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://verntabase_user:R9lGnsXnYqaulsYEwrvA9lC1Q2aPccPP@dpg-d7f3t8kvikkc73dgbrh0-a.virginia-postgres.render.com/verntabase';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render
});

app.use(cors());
app.use(express.json());

// Serve React build (needed for Render deployment)
app.use(express.static(path.join(__dirname, 'build')));

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        items JSONB DEFAULT '[]',
        total NUMERIC DEFAULT 0,
        status TEXT DEFAULT 'pending',
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

// POST - submit a new registration
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = {
      id: 'VB-' + Date.now(),
      status: 'pending',
      ...req.body
    };
    
    await pool.query(
      'INSERT INTO orders (id, customer_id, items, total, status) VALUES ($1, $2, $3, $4, $5)',
      [newOrder.id, newOrder.customerId, JSON.stringify(newOrder.items || []), newOrder.total || 0, newOrder.status]
    );
    
    res.json({ success: true, orderId: newOrder.id });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - all orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = result.rows.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      items: row.items,
      total: row.total,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - approve
app.put('/api/orders/:id/approve', async (req, res) => {
  try {
    await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['approved', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error approving order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT - decline
app.put('/api/orders/:id/decline', async (req, res) => {
  t

// ===== PLAYER ENDPOINTS =====

// POST - register a new player
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
    
    res.json({ success: true, player: result.rows[0] });
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - all players
app.get('/api/players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at DESC');
    const players = result.rows.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      sports: row.sports,
      sportPositions: row.sport_positions,
      createdAt: row.created_at
    }));
    res.json(players);
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - remove a player
app.delete('/api/players/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM players WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting player:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== TEAMS ENDPOINTS =====

// POST - create a new team
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
    res.json({ 
      success: true, 
      team: {
        id: row.id,
        teamName: row.name,
        ...row.members,
        createdAt: row.created_at
      }
    });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET - all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams ORDER BY created_at DESC');
    const teams = result.rows.map(row => {
      const members = row.members || {};
      return {
        id: row.id,
        teamId: row.id,
        teamName: row.name,
        sport: members.sport,
        players: members.players || [],
        createdAt: row.created_at
      };
    });
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT - update a team (remove player)
app.put('/api/teams/:id', async (req, res) => {
  try {
    const { players, sport } = req.body;
    
    const result = await pool.query(
      'UPDATE teams SET members = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify({ sport, players }), req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE - remove a team
app.delete('/api/teams/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting team:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});ry {
    await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['declined', req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error declining order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all: send React app for any other route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ PostgreSQL connected successfully');
    
    // Initialize tables
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`✓ Vernball server running on port ${PORT}`);
      console.log(`✓ Database: PostgreSQL on Render`);
    });
  } catch (err) {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
