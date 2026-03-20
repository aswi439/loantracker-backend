// src/index.ts — Main server entry point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';
import uploadRoutes from './routes/uploads';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*', // In production: restrict to your app's domain/IP
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Auth endpoints get stricter rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many auth attempts' },
});
app.use('/api/auth', authLimiter);

// ── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ── Database connection ──────────────────────────────────
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
