# PostgreSQL Setup Guide - Vernball

Your website is now connected to PostgreSQL! 🎉

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

This will install the PostgreSQL driver (`pg`) needed to connect to your database.

### 2. Set Up Environment Variables
Create a `.env` file in your project root with your Render database URL:

```
DATABASE_URL=postgresql://verntabase_user:R9lGnsXnYqaulsYEwrvA9lC1Q2aPccPP@dpg-d7f3t8kvikkc73dgbrh0-a.virginia-postgres.render.com/verntabase
PORT=5000
```

**Note:** The `.env` file is already created. Don't commit it to Git (add to `.gitignore`)!

### 3. Initialize Database
Run the setup script to create all tables:

```bash
node setup-db.js
```

This will:
- Test your database connection
- Create the `orders` table
- Create the `games` table
- Create the `hall_of_fame` table
- Create the `teams` table

### 4. Start Your Server
```bash
npm start
```

The server will display:
```
✓ PostgreSQL connected successfully
✓ Database tables initialized successfully
✓ Vernball server running on port 5000
✓ Database: PostgreSQL on Render
```

## What Changed

### Before (JSON File Storage)
- Data was saved to `orders.json`
- Only one person could see updates
- Data lost if the instance crashed

### After (PostgreSQL)
- Data is saved to your Render PostgreSQL database ✓
- **All users see updates in real-time** ✓
- Data persists across server restarts ✓
- Scalable and production-ready ✓

## API Endpoints

All existing endpoints work the same, but now use the database:

- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get all orders (real-time from DB)
- `PUT /api/orders/:id/approve` - Approve an order
- `PUT /api/orders/:id/decline` - Decline an order

## Connecting to Your Database Directly

You can also view/manage data directly from Render:

### Using psql CLI:
```bash
psql postgresql://verntabase_user:R9lGnsXnYqaulsYEwrvA9lC1Q2aPccPP@dpg-d7f3t8kvikkc73dgbrh0-a.virginia-postgres.render.com/verntabase
```

### Or use Render's SQL Editor:
1. Go to your Render database dashboard
2. Click "Query"
3. Run SQL commands like:
```sql
SELECT * FROM orders;
SELECT * FROM games;
SELECT * FROM hall_of_fame;
SELECT * FROM teams;
```

## Troubleshooting

### Connection Error?
- Check your internet connection
- Verify `DATABASE_URL` in `.env` is correct
- Try running `setup-db.js` again

### Data Not Persisting?
- Make sure `npm install` was run (to install `pg` package)
- Restart the server: `npm start`
- Check database with `psql` command above

### Want to Reset Database?
Connect to your database and run:
```sql
DROP TABLE IF EXISTS orders, games, hall_of_fame, teams;
```

Then run `node setup-db.js` again.

## Next Steps

1. ✅ Update frontend components to show real-time data
2. ✅ Add real-time notifications when data changes
3. ✅ Implement user authentication
4. ✅ Add more complex queries/filters

Your website now has a professional database backend! 🚀
