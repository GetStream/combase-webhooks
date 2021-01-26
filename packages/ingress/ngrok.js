import 'dotenv/config.js';
import ngrok from 'ngrok';
import { logger } from 'utils';

try {
	const url = await ngrok.connect({
		proto: 'http',
		addr: process.env.PORT,
		subdomain: process.env.NGROK_SUBDOMAIN_URL,
		authtoken: process.env.NGROK_AUTH_TOKEN,
	});

	logger.info(`NGROK: ${ngrok.getUrl()}`)

	async function cleanup() {
		await ngrok.kill(url);
	}

	process.on('SIGINT', cleanup);
} catch (error) {
	console.error(error);
}
