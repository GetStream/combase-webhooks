import path from 'path';
import slash from 'slash';
import fs from 'fs-extra';

import { createPlugin } from './createPlugin';

export const createEcosystemPlugins = async () => {
	// eslint-disable-next-line no-sync
	let pluginConfigs = JSON.parse(fs.readFileSync(slash(path.join(process.cwd(), '.data', 'integration-manifest.json'))));
	
	pluginConfigs = await Promise.all(pluginConfigs.map(async (config) => {
		const { internal: { path } } = config;
		const pluginModule = await import(path);
		return {
			...config,
			pluginModule
		}
	}));

	return pluginConfigs.map(createPlugin);
};
