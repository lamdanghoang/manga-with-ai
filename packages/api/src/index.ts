import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import storiesRouter from './routes/stories';
import { startJobPoller } from './workers/poller';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/v1', authRouter);
app.use('/v1', storiesRouter);

const PORT = process.env.API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  startJobPoller();
});

export default app;
