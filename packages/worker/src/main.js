import { logger, consumerConfig } from 'utils';
import { CaptainHook } from '@captain-hook/core';
import { createRascalEngine } from '@captain-hook/rascal-engine';

import { DebugPlugin } from './plugins';
import { createEcosystemPlugins } from './combase-ecosystem';

const engine = await createRascalEngine(consumerConfig);

const plugins = await createEcosystemPlugins();

const capn = new CaptainHook({
	engine,
	logger,
	plugins,
});

logger.info(`worker initialized with ${capn.plugins.length} plugin${capn.plugins.length === 1 ? '' : 's'}`);
