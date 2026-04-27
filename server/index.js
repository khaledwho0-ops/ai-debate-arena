// ============================================================
// AI DEBATE ARENA — Express Server + WebSocket
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// ---- WebSocket Server ----
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Map(); // debateId -> Set<ws>

wss.on('connection', (ws, req) => {
  const debateId = new URL(req.url, 'http://localhost').searchParams.get('debateId');
  if (debateId) {
    if (!wsClients.has(debateId)) wsClients.set(debateId, new Set());
    wsClients.get(debateId).add(ws);
    console.log(`🔌 WS client joined debate: ${debateId}`);

    ws.on('close', () => {
      wsClients.get(debateId)?.delete(ws);
      if (wsClients.get(debateId)?.size === 0) wsClients.delete(debateId);
    });
  }
});

// Broadcast to all clients watching a debate
function broadcast(debateId, data) {
  const clients = wsClients.get(debateId);
  if (!clients) return;
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rate limiting: 30 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use('/api/', limiter);

// ---- API Routes ----
const debateRoutes = require('./routes/debates');
app.use('/api/debates', debateRoutes(broadcast));

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ---- SPA Fallback ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ---- Start Server (after DB init) ----
const { initDB } = require('./db');
const PORT = process.env.PORT || 3000;

initDB().then(() => {
  server.listen(PORT, () => {
    console.log('');
    console.log('  ⚔️  ══════════════════════════════════════════');
    console.log('  ⚔️   AI DEBATE ARENA — Server Running');
    console.log(`  ⚔️   http://localhost:${PORT}`);
    console.log('  ⚔️  ══════════════════════════════════════════');
    console.log('');
  });
}).catch(err => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
