import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import { logger } from "utils";

import { capn } from "./capn";

import { dataDir } from '../utils/paths';

console.log('data dir from here', dataDir)

const { PORT = 8081 } = process.env;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());
app.use("/webhook", capn.use);

await app.listen(PORT);

logger.info(`🚀 //:${PORT} • Combase Webhook Ingress 💬`);
