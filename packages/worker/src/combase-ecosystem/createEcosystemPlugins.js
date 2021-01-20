import path from 'path';
import slash from 'slash';
import fs from 'fs-extra';
import deepmerge from 'deepmerge';

import { createPlugin } from './createPlugin';

const mapPluginMethodsToTriggers = (plugin, { triggers }) => {
	const obj = {};
	// Replaces method names with the _actual_ method from the plugins exports.
	Object.entries(triggers).forEach(([trigger, methodName]) => {
		if (Array.isArray(obj[trigger])) {
			obj[trigger].push(plugin[methodName]);
		} else {
			obj[trigger] = [plugin[methodName]];
		}
	});

	console.log(obj)
	return merge(obj);
};

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
	// const triggerMap = plugins.flatMap((plugin, i) => mapPluginMethodsToTriggers(plugin, pluginConfigs[i]));

	const listeners = deepmerge.all(pluginConfigs.flatMap(({ pluginModule, triggers }) => Object.entries(triggers).map(([key, value]) => ({ [key]: [pluginModule[value]] }))));
	
	return createPlugin()
};
