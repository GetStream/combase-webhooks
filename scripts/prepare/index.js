import fs from 'fs-extra';
import { dataDir, manifest } from 'utils';

import config from '../../combase.config.json';

import { loadPlugins } from './plugins';

try {
	await fs.ensureDir(dataDir);
	const plugins = await loadPlugins(config);
	console.log(plugins);
	await fs.writeFile(manifest, JSON.stringify(plugins));
} catch (error) {
	console.error(error);
}
