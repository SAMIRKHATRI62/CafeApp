const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// --- MVP storage (in-memory) ---
const MENU = [
  { id: 'espresso', name: 'Espresso', price: 2.5 },
  { id: 'cappuccino', name: 'Cappuccino', price: 3.5 },
  { id: 'latte', name: 'Latte', price: 3.75 },
  { id: 'americano', name: 'Americano', price: 3.0 },
  { id: 'croissant', name: 'Croissant', price: 2.75 },
  { id: 'sandwich', name: 'Sandwich', price: 5.5 },
  { id: 'cake', name: 'Cake Slice', price: 4.0 },
  { id: 'water', name: 'Water', price: 1.0 },
];

/**
 * Order shape:
 * {
 *   id, createdAt, table, note,
 *   items: [{menuId, name, qty, price, lineTotal}],
 *   subtotal, tax, total,
 *   status: 'new'|'accepted'|'ready'|'billed',
 * }
 */
const orders = new Map();
let nextOrderNumber = 1001;

const TAX_RATE = 0.05; // simple MVP tax

function money(n) {
  return Math.round(n * 100) / 100;
}

function buildOrder({ table, note, items }) {
  const createdAt = new Date().toISOString();
  const id = String(nextOrderNumber++);

  const normalizedItems = [];
  for (const it of items ?? []) {
    const menu = MENU.find((m) => m.id === it.menuId);
    const qty = Number(it.qty);
    if (!menu || !Number.isFinite(qty) || qty <= 0) continue;

    const lineTotal = money(menu.price * qty);
    normalizedItems.push({
      menuId: menu.id,
      name: menu.name,
      qty,
      price: menu.price,
      lineTotal,
    });
  }

  if (normalizedItems.length === 0) {
    const err = new Error('Order must contain at least one item');
    err.statusCode = 400;
    throw err;
  }

  const subtotal = money(normalizedItems.reduce((sum, i) => sum + i.lineTotal, 0));
  const tax = money(subtotal * TAX_RATE);
  const total = money(subtotal + tax);

  return {
    id,
    createdAt,
    table: (table ?? '').toString().slice(0, 20),
    note: (note ?? '').toString().slice(0, 200),
    items: normalizedItems,
    subtotal,
    tax,
    total,
    status: 'new',
  };
}

// --- Static site ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API ---
app.get('/api/menu', (req, res) => {
  res.json({ menu: MENU, taxRate: TAX_RATE });
});

app.get('/api/orders', (req, res) => {
  const list = [...orders.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json({ orders: list });
});

app.post('/api/orders', (req, res) => {
  try {
    const order = buildOrder(req.body);
    orders.set(order.id, order);

    io.emit('order:new', order);

    res.status(201).json({ order });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message || 'Failed to create order' });
  }
});

app.patch('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  const current = orders.get(id);
  if (!current) return res.status(404).json({ error: 'Order not found' });

  const status = (req.body?.status ?? '').toString();
  const allowed = new Set(['new', 'accepted', 'ready', 'billed']);
  if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });

  const updated = { ...current, status };
  orders.set(id, updated);
  io.emit('order:update', updated);

  res.json({ order: updated });
});

io.on('connection', (socket) => {
  socket.emit('server:hello', { ok: true });
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`CafeApp running on:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Network: http://<YOUR-PC-IP>:${PORT}`);
});
