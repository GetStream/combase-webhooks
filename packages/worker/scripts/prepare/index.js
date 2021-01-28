import slash from 'slash';
import path from 'path';
import fs from 'fs-extra';
import { dataDir } from 'utils';

import config from '../../combase.config.json';

import { loadPlugins } from './plugins';

try {
	await fs.ensureDir(slash(dataDir));

	const plugins = await loadPlugins(config);

	await fs.writeFile(slash(path.join(dataDir, 'integration-manifest.json')), JSON.stringify(plugins));
} catch (error) {
	console.error(error);
}
