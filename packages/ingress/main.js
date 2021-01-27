import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import { logger } from "utils";

import { capn } from "./capn";

const { port = 8080 } = process.env;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());
app.use("/webhook", capn.use);

await app.listen(port);

logger.info(`🚀 //:${port}${apollo.graphqlPath} • Combase Webhook Ingress 💬`);
