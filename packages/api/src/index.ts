import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () { return Number(this); };

// Suppress unhandled SSL errors from background connections
process.on('uncaughtException', (err) => {
  if (err.message?.includes('EPROTO') || err.message?.includes('ssl')) {
    console.warn('[WARN] Suppressed SSL error:', err.message.slice(0, 80));
    return;
  }
  console.error('Uncaught:', err);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import storiesRouter from './routes/stories';
import { startJobPoller } from './workers/poller';

import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/v1', authRouter);

// Payment: free tier check + x402 paywall (only if MERCHANT_WALLET set)
if (process.env.MERCHANT_WALLET) {
  const { freeTierGuard } = require('./middleware/freeTier');
  const { paywall } = require('./middleware/paywall');
  app.use('/v1', freeTierGuard, (req: any, res: any, next: any) => {
    if (req.skipPayment) { console.log('[PAY] Free tier, skipping'); return next(); }
    console.log('[PAY] Paywall active for:', req.method, req.path);
    return paywall(req, res, next);
  });
}

app.use('/v1', storiesRouter);

const PORT = process.env.API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  startJobPoller();
});

export default app;
