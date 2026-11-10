import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { sanitize, originCheck, apiLimiter } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URLS, credentials: true }));
app.use(cookieParser());
app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api', apiLimiter);
// CSV imports send parsed rows as JSON, so those routes get a larger body limit; everything else stays small.
app.use('/api/import', express.json({ limit: '5mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(sanitize);
app.use(originCheck);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
