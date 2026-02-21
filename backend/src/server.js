const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection }   = require('./config/supabase');
const authRoutes           = require('./routes/authRoutes');
const profileRoutes        = require('./routes/profileRoutes');
const productsRoutes       = require('./routes/productsRoutes');
const adminRoutes          = require('./routes/adminRoutes');
const ordersWishlistRoutes = require('./routes/ordersWishlistRoutes.js');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, cb) => cb(null, true), // permissif en dev (file://, localhost)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── Health ─────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ── Routes — ORDRE CRITIQUE ────────────────────────────────────
// ordersWishlistRoutes EN PREMIER sur /api
// pour que /api/checkout, /api/orders, /api/wishlist et /api/admin/orders
// soient résolus AVANT que adminRoutes (monté sur /api/admin) ne les capture.
app.use('/api',          ordersWishlistRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/admin',    adminRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Démarrage ─────────────────────────────────────────────────
async function startServer() {
  try {
    const ok = await testConnection();
    if (!ok) { console.error('❌ DB connection failed'); process.exit(1); }

    app.listen(PORT, () => {
      console.log('\n🌿 ================================');
      console.log(`🚀 BioXplore API  —  port ${PORT}`);
      console.log('🌿 ================================');
      console.log('📋 Routes actives :');
      console.log('   POST   /api/checkout');
      console.log('   GET    /api/orders');
      console.log('   GET    /api/wishlist');
      console.log('   POST   /api/wishlist/:productId');
      console.log('   DELETE /api/wishlist/:productId');
      console.log('   GET    /api/admin/orders');
      console.log('   PUT    /api/admin/orders/:id/status');
      console.log('   ...auth, profile, products, admin/products\n');
    }).on('error', err => {
      if (err.code === 'EADDRINUSE') { console.error(`❌ Port ${PORT} déjà utilisé`); process.exit(1); }
      throw err;
    });
  } catch (e) {
    console.error('❌ Démarrage impossible :', e);
    process.exit(1);
  }
}

startServer();
module.exports = app;