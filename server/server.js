import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, getMongoStatus } from './db.js';
import { getCloudinaryStatus } from './utils/cloudinary.js';
import authRoutes from './routes/auth.js';
import tripsRoutes from './routes/trips.js';
import ticketsRoutes from './routes/tickets.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health, DB, and Cloudinary status check
app.get('/api/health', (req, res) => {
  const dbStatus = getMongoStatus();
  const cloudinaryStatus = getCloudinaryStatus();
  res.json({
    status: 'online',
    appName: 'TripNest API',
    tagline: 'Every trip. Every ticket. One place.',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    cloudinary: cloudinaryStatus,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/tickets', ticketsRoutes);

// Serve frontend production build if present (Unified Fullstack Deploy)
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[TripNest Server Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    const cloudStatus = getCloudinaryStatus();
    console.log(`===============================================`);
    console.log(`🚀 TripNest Server is running on http://localhost:${PORT}`);
    console.log(`✈️  Tagline: "Every trip. Every ticket. One place."`);
    console.log(`📦 Database: ${getMongoStatus().mode}`);
    console.log(`☁️  Cloudinary: ${cloudStatus.isConfigured ? 'Active (' + cloudStatus.cloudName + ')' : 'Standby (no credentials in .env)'}`);
    console.log(`===============================================`);
  });
}

startServer();
