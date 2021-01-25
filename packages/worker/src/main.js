import { logger, consumerConfig } from 'utils';
import { CaptainHook } from '@captain-hook/core';
import { CaptainRascalEngine } from '@captain-hook/rascal-engine';

import { DebugPlugin } from './plugins';
import { createEcosystemPlugins } from './combase-ecosystem';

const plugins = await createEcosystemPlugins();

const capn = new CaptainHook({
	engine: await CaptainRascalEngine.create(consumerConfig),
	logger,
	plugins,
});

logger.info(`worker initialized with ${capn.plugins.length} plugin${capn.plugins.length === 1 ? '' : 's'}`);
