import { createPlugin } from './createPlugin';

export const createEcosystemPlugins = async (manifest) => {
	let pluginConfigs = manifest;

	pluginConfigs = await Promise.all(pluginConfigs.map(async (config) => {
		const { internal: { name } } = config;

		const pluginModule = await import(name);
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
