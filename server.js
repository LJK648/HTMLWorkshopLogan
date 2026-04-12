const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

app.use(cors());
app.use(express.json());

// Serve React build (needed for Render deployment)
app.use(express.static(path.join(__dirname, 'build')));

function readOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// POST - submit a new registration
app.post('/api/orders', (req, res) => {
  const orders = readOrders();
  const newOrder = {
    id: 'VB-' + Date.now(),
    status: 'pending',
    date: new Date().toISOString(),
    ...req.body
  };
  orders.push(newOrder);
  writeOrders(orders);
  res.json({ success: true, orderId: newOrder.id });
});

// GET - all orders
app.get('/api/orders', (req, res) => {
  res.json(readOrders());
});

// PUT - approve
app.put('/api/orders/:id/approve', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (order) order.status = 'approved';
  writeOrders(orders);
  res.json({ success: true });
});

// PUT - decline
app.put('/api/orders/:id/decline', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (order) order.status = 'declined';
  writeOrders(orders);
  res.json({ success: true });
});

// Catch-all: send React app for any other route
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Vernball server running on port ${PORT}`));
