import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';

import { capn } from './capn';

const app = express();

app.use('/webhook', bodyParser.json());
app.use('/webhook', capn.use);

const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

// eslint-disable-next-line no-console
server.listen(PORT, () => console.log(`PORT: ${PORT}`));
