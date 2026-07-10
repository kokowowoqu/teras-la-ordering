const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'orders.json');

// Middleware
app.use(cors());
app.use(express.json());

// Fungsi baca/tulis data
function readOrders() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

// ===== API ENDPOINTS =====

// 1. GET semua pesanan (untuk tenant)
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// 2. GET status satu pesanan (untuk polling pelanggan)
app.get('/api/order/:id/status', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.orderId === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({
    status: order.status,
    history: order.statusHistory || []
  });
});

// 3. POST buat pesanan baru
app.post('/api/order', (req, res) => {
  const { orderId, table, customerName, items, total, createdAt } = req.body;

  const orders = readOrders();
  const existing = orders.find(o => o.orderId === orderId);
  if (existing) {
    return res.status(400).json({ error: 'Order already exists' });
  }

  const newOrder = {
    orderId,
    table,
    customerName,
    items,
    total,
    status: 0,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      { label: 'Pesanan Masuk', time: new Date().toISOString() }
    ]
  };

  orders.push(newOrder);
  writeOrders(orders);

  // 🔔 Kirim notifikasi real-time ke semua client (tenant & customer)
  io.emit('new-order', newOrder);
  io.emit('order-update', { orderId, status: 0, history: newOrder.statusHistory });

  console.log(`📢 [NOTIF] Pesanan BARU: ${orderId} dari Meja ${table} (${customerName})`);

  res.status(201).json({ message: 'Order created', orderId });
});

// 4. PUT update status pesanan
app.put('/api/order/:id/status', (req, res) => {
  const { action } = req.body;
  const orders = readOrders();
  const order = orders.find(o => o.orderId === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  let newStatus = order.status;
  const now = new Date().toISOString();
  const labelMap = {
    cook: 'Mulai Dimasak',
    ready: 'Siap Saji',
    complete: 'Selesai'
  };

  if (action === 'cook' && order.status === 0) {
    newStatus = 1;
    order.statusHistory.push({ label: labelMap.cook, time: now });
  } else if (action === 'ready' && order.status === 1) {
    newStatus = 2;
    order.statusHistory.push({ label: labelMap.ready, time: now });
  } else if (action === 'complete' && order.status === 2) {
    newStatus = 3;
    order.statusHistory.push({ label: labelMap.complete, time: now });
  } else {
    return res.status(400).json({ error: 'Invalid action or status' });
  }

  order.status = newStatus;
  order.updatedAt = now;
  writeOrders(orders);

  // 🔔 Kirim notifikasi real-time
  io.emit('order-update', { orderId: order.orderId, status: newStatus, history: order.statusHistory });

  console.log(`📢 [NOTIF] Status ${order.orderId} -> ${newStatus} (${action})`);

  res.json({
    status: newStatus,
    history: order.statusHistory
  });
});

// ===== SOCKET.IO CONNECTION =====
io.on('connection', (socket) => {
  console.log(`🔗 Client terhubung: ${socket.id}`);

  // Kirim semua pesanan yang ada saat client connect
  const orders = readOrders();
  socket.emit('initial-orders', orders);

  socket.on('disconnect', () => {
    console.log(`❌ Client terputus: ${socket.id}`);
  });
});

// Jalankan server
server.listen(PORT, () => {
  console.log(`🚀 Backend berjalan di http://localhost:${PORT}`);
  console.log(`📂 Data tersimpan di ${DATA_FILE}`);
  console.log(`🔌 Socket.io aktif untuk real-time`);
});