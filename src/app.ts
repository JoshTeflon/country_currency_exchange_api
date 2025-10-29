import express from 'express';
import cors from 'cors';

import countryRoutes from './routes/countryRoutes';
import { errorHandler } from './utils/validators';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/countries', countryRoutes);

app.get('/status', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use(errorHandler);

export default app;