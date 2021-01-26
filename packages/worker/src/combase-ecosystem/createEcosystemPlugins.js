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

	const plugins = {};
	pluginConfigs.forEach((plugin) => {
		Object.entries(plugin.triggers)
			.filter(([trigger, method]) => trigger && method)
			.forEach(([trigger, method]) => {
				let cb = plugin?.pluginModule?.[method];
				if (cb) {
					if (!plugins[trigger]) {
						plugins[trigger] = [cb]
					} else if (plugins[trigger].length) {
						plugins[trigger].push(cb)
					};
				}
			});
	})

	return [createPlugin(plugins)]
};
