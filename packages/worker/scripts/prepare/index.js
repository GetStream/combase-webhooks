import slash from 'slash';
import path from 'path';
import fs from 'fs-extra';

import config from '../../combase.config.json';

import { installPlugins, loadPlugins } from './plugins';

try {
	const dataDir = path.join(process.cwd(), '.data');

	await fs.ensureDir(slash(dataDir));
	
	await installPlugins();

	const plugins = await loadPlugins(config);

	await fs.writeFile(slash(path.join(dataDir, 'integration-manifest.json')), JSON.stringify(plugins));
} catch (error) {
	console.error(error);
}
