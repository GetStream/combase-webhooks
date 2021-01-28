import slash from 'slash';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
console.log("URL", require)
const hashPkg = obj => {
	const alg = 'sha256';
	const enc = 'hex';
	const data = JSON.stringify(obj);

	return crypto.createHash(alg).update(data).digest(enc);
};

const resolvePlugin = pluginName => {
	const pathToPluginDir = slash(path.dirname(require.resolve(pluginName)));

	// eslint-disable-next-line no-sync
	const packageJSON = JSON.parse(fs.readFileSync(`${pathToPluginDir}/package.json`, `utf-8`));
	// eslint-disable-next-line no-sync
	const configJSON = JSON.parse(fs.readFileSync(`${pathToPluginDir}/combase.config.json`, `utf-8`));

	let iconPath;
	let icon;

	if (configJSON.icon) {
		iconPath = slash(path.join(pathToPluginDir, configJSON.icon));

		// eslint-disable-next-line no-sync
		icon = fs.existsSync(iconPath) ? fs.readFileSync(iconPath, { encoding: 'base64' }) : undefined;
	}

	const internal = {
		path: pathToPluginDir,
		name: packageJSON.name,
		version: packageJSON.version,
	};

	return {
		...configJSON,
		internal: {
			...internal,
			hash: hashPkg(packageJSON),
		},
		id: uuid(),
	};
};

export const loadPlugins = config => {
	const plugins = config.plugins.map(pluginName => resolvePlugin(pluginName));
	// TODO: need to perform some validation checks in resolvePlugin

	// TODO: We should return undefined from resolvePlugin if the plugin is malformed or invalid etc.
	return plugins.filter(plugin => Boolean(plugin));
};
