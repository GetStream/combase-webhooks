import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import fs from 'fs';
import path from 'path';
import slash from 'slash';
import { fileURLToPath } from 'url';
import { logger } from "utils";

import { capn } from "./capn";

const { PORT = 8081 } = process.env;

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());
app.use("/webhook", capn.use);

app.get('/integration-definitions', (req, res) => {
	const integrations = fs.readFileSync(createPath(__dirname, '../../', '.data', 'integration-manifest.json'));
	
	return res.send(JSON.parse(integrations)).end();
});


await app.listen(PORT);

logger.info(`🚀 //:${PORT} • Combase Webhook Ingress 💬`);
