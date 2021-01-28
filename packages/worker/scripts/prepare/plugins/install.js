//TODO: Doesn't run rn because we symlink the plugins
import execa from 'execa';

import config from '../../../combase.config.json';

const { plugins } = config;

if (plugins.length === 0 || !plugins || !Array.isArray(plugins)) {
	process.exit(0);
}

export const installPlugins = async () => {
	const subprocess = execa('yarn', ['add', ...plugins]);

	try {
		subprocess.stdout.pipe(process.stdout);

		await subprocess;
	} catch (error) {
		process.exit(1);
	}
}