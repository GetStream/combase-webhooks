import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import fs from 'fs';
import { logger, manifest } from "utils";

import { capn } from "./capn";

const { PORT = 8081 } = process.env;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());
app.use("/webhook", capn.use);

app.get('/integration-definitions', (req, res) => {
	const integrations = fs.readFileSync(manifest);
	
	return res.send(JSON.parse(integrations)).end();
});


await app.listen(PORT);

logger.info(`🚀 //:${PORT} • Combase Webhook Ingress 💬`);
