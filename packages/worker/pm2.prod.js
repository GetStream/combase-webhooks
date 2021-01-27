module.exports = {
	apps: [
		{
			name: "webhook-worker",
			script: "node --es-module-specifier-resolution=node main.js",
			output: "/dev/stdout",
			error: "/dev/stderr",
			merge_logs: true,
			instances: process.env.WEB_CONCURRENCY || 4,
			exec_mode: "cluster",
			autorestart: true,
			watch: false,
		},
	],
};
