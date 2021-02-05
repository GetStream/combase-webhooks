import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CaptainHook } from "@captain-hook/core";
import { CaptainRascalEngine } from "@captain-hook/rascal-engine";
import { logger, consumerConfig, createPath } from "utils";

import { createEcosystemPlugins } from "./combase-ecosystem";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(createPath([__dirname, '../../', 'dist', 'integration-manifest.json'])));
const plugins = await createEcosystemPlugins(manifest);

const capn = new CaptainHook({
	engine: await CaptainRascalEngine.create(consumerConfig, true),
	logger,
	plugins,
});

logger.info(
	`Combase worker initialized with ${capn.plugins.length} plugin${
		capn.plugins.length === 1 ? "" : "s"
	}`
);
