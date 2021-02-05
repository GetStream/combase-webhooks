import fs from 'fs';
import path from 'path';
import { CaptainHook } from "@captain-hook/core";
import { CaptainRascalEngine } from "@captain-hook/rascal-engine";
import { logger, consumerConfig, createPath } from "utils";

import { createEcosystemPlugins } from "./combase-ecosystem";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const plugins = await createEcosystemPlugins(fs.readFileSync(createPath([__dirname, '../../../', '.data', 'integration-manifest.json'])));

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
