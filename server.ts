import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    restaurant: 'GOLDEN PALACE POS - القصر الذهبي',
    branch: 'عند الجيجلي • حسين داي',
    phone: '0791755614',
    time: new Date().toISOString(),
  });
});

// Mount All Backend API Routes
app.use('/api', apiRouter);

// Serve Frontend
const isProduction = process.env.NODE_ENV === 'production';
const distPath = path.resolve(__dirname, 'dist');

if (isProduction && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  // Development Mode with Vite Middleware
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🏰 GOLDEN PALACE POS Server active on http://0.0.0.0:${PORT}`);
});
