import { graphql, logger } from 'utils';

export const createPlugin = plugin =>
	class CombaseEcosystemPlugin {
		constructor(capn) {
			this.capn = capn;
			this.triggers = Object.keys(plugin.triggers);

			Object.entries(plugin.triggers)
				.filter(([trigger, method]) => trigger && method)
				.forEach(([trigger, method]) => {
					this[trigger] = plugin.pluginModule[method];
				});

			this.listen();
		}

		authenticateRequest = event => {
			const headers = {};
			const org = event?.data?.fullDocument?.organization;

			/**
			 * ? We can potentially create a scoped JWT here.
			 */

			if (org) {
				headers['combase-organization'] = org.toString();
			}

			return headers;
		};

		actions(event) {
			return {
				request: (document, variables) => graphql.request(document, variables, this.authenticateRequest(event)),
			};
		}

		listen = async () => {
			for await (const event of this.capn.listen(this.triggers)) {
				try {
					if (this[event.trigger]) {
						await this[event.trigger](event, this.actions(event));
					} else {
						console.log(this);
					}
				} catch (error) {
					logger.error(error);
				}
			}
		};
	};
