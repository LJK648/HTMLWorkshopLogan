#!/usr/bin/env node
/**
 * Database Setup Script
 * Run this once to initialize your PostgreSQL database with the required tables
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://verntabase_user:R9lGnsXnYqaulsYEwrvA9lC1Q2aPccPP@dpg-d7f3t8kvikkc73dgbrh0-a.virginia-postgres.render.com/verntabase';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  console.log('🔄 Setting up PostgreSQL database...\n');
  
  try {
    // Test connection
    const connection = await pool.connect();
    console.log('✓ Connected to PostgreSQL\n');
    connection.release();
    
    // Create tables
    console.log('Creating tables...');
    
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
    `);
    console.log('✓ orders table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ games table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hall_of_fame (
        id SERIAL PRIMARY KEY,
        player_name TEXT NOT NULL,
        score INTEGER,
        game_id INTEGER REFERENCES games(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ hall_of_fame table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        members JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ teams table created\n');
    
    console.log('✅ Database setup complete!');
    console.log('You can now start your server with: npm start\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    console.error('\nMake sure:');
    console.error('1. DATABASE_URL is set in .env');
    console.error('2. Your internet connection is working');
    console.error('3. The Render database credentials are correct\n');
    process.exit(1);
  }
}

setupDatabase();
