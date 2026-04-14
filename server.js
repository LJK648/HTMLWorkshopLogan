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
  try {
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
