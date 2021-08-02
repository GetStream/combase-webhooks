import fs from 'fs-extra';
import { dataDir, manifest } from 'utils';

import config from '../../combase.config.json';

import { installPlugins, loadPlugins } from './plugins';

try {
	await fs.ensureDir(dataDir);
	await installPlugins();
	const plugins = await loadPlugins(config);

	await fs.writeFile(manifest, JSON.stringify(plugins));
} catch (error) {
	console.error(error);
}
