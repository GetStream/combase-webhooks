import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createPath, logger } from "utils";

import { capn } from "./capn";
import { commands } from "./commands";
import zendeskChannelIntegration from "./zendesk";

const { PORT = 8081 } = process.env;

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());

/** The Capn' */
app.use('/webhook', capn.use);

app.use('/zendesk', zendeskChannelIntegration);
app.use('/chat-commands', commands.middleware);

app.get('/integration-definitions', (req, res) => {
	const integrations = fs.readFileSync(createPath([__dirname, '../../', '.data', 'integration-manifest.json']));
	
	return res.send(JSON.parse(integrations)).end();
});

await app.listen(PORT);

logger.info(`🚀 //:${PORT} • Combase Webhook Ingress 💬`);
