import express from 'express';
import bodyParser from 'body-parser';
import { logger } from 'utils';

import { capn } from './capn';

const { PORT = 8080 } = process.env;

const app = express();

app.use('/webhook', bodyParser.json());
app.use('/webhook', capn.use);

await app.listen(PORT);

logger.info(`🚀 :${PORT} • Combase by Stream • Webhook Ingress`);