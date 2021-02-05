import { logger, consumerConfig, manifest } from "utils";
import { CaptainHook } from "@captain-hook/core";
import { CaptainRascalEngine } from "@captain-hook/rascal-engine";

import { createEcosystemPlugins } from "./combase-ecosystem";

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
