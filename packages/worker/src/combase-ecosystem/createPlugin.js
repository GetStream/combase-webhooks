import { gql } from './graphqlClient';

export const createPlugin = pluginTriggerMap =>
	class CombaseEcosystemPlugin {
		constructor(capn) {
			this.capn = capn;
			this.triggers = Object.keys(pluginTriggerMap);

			Object.entries(pluginTriggerMap)
				.filter(([trigger, method]) => trigger && method)
				.forEach(([trigger, method]) => {
					this[trigger] = method;
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
				request: (document, variables) => gql.request(document, variables, this.authenticateRequest(event)),
			};
		}

		listen = async () => {
			for await (const event of this.capn.listen(this.triggers)) {
				try {
					await this[event.trigger]?.(event, this.actions(event));
				} catch (error) {
					console.error(error);
				}
			}
		};
	};
