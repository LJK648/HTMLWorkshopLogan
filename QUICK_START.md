# 🚀 Quick Start - PostgreSQL Connection

## 3 Steps to Get Running

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Initialize Database
```bash
npm run setup-db
```

You should see:
```
✓ Connected to PostgreSQL
✓ orders table created
✓ games table created
✓ hall_of_fame table created
✓ teams table created
✅ Database setup complete!
```

### Step 3: Start Your Server
```bash
npm start
```

Server will output:
```
✓ PostgreSQL connected successfully
✓ Vernball server running on port 5000
```

## ✅ You're Done!

Your app now:
- Saves all data to PostgreSQL on Render
- Allows multiple users to see changes in real-time
- Has data that persists across restarts

## Common Commands

```bash
# View data in database
psql postgresql://verntabase_user:R9lGnsXnYqaulsYEwrvA9lC1Q2aPccPP@dpg-d7f3t8kvikkc73dgbrh0-a.virginia-postgres.render.com/verntabase

# Run queries in psql
\dt                           # List all tables
SELECT * FROM orders;         # View all orders
SELECT * FROM games;          # View all games
```

## Need Help?

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for troubleshooting.
