import execa from 'execa';

import config from '../../../combase.config.json';
import { logger } from '../../../packages/utils';

const { plugins } = config;

if (plugins.length === 0 || !plugins || !Array.isArray(plugins)) {
	process.exit(0);
}

export const installPlugins = async () => {
	const subprocess = execa('yarn', ['workspace', 'worker', 'add', ...plugins]);

	try {
		subprocess.stdout.pipe(process.stdout);

		await subprocess;
	} catch (error) {
		logger.error(error.message);
		process.exit(1);
	}
}