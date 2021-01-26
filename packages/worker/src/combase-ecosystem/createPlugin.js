import { graphql, logger } from 'utils';

export const createPlugin = plugins =>
	class CombaseEcosystemPlugin {
		constructor(capn) {
			this.capn = capn;
			this.triggers = Object.keys(plugins);

			Object.entries(plugins).forEach(([trigger, method]) => {
					this[trigger] = method;
				});

			this.listen();
		}

		authenticateRequest = event => {
			const headers = {};

			if (event.organization) {
				headers['combase-organization'] = event.organization.toString();
			}

			return headers;
		};

		actions(event) {
			return {
				request: (document, variables) => graphql.request(document, variables, this.authenticateRequest(event)),
			};
		}

		listen = async () => {
			let i = 0;
			for await (const [event, ackOrNack] of this.capn.listen(this.triggers)) {
				console.log(i);
				try {
					if (typeof this[event.trigger] === 'function') {
						await this[event.trigger](event, this.actions(event));
						i++;
						ackOrNack();
					} else if (Array.isArray(this[event.trigger])) {
						await Promise.all(this[event.trigger].map(fn => fn(event, this.actions(event))));
						i++;
						ackOrNack();
					} else {
						throw new Error('Event was not consumed.');
					}
				} catch (error) { 
					logger.error(error)
					// TODO: Currently just throws the message to the deferred_retry recovery strategy - we should check the error and conditionally send to dead_letter immediately if applicable.
					ackOrNack(error, this.capn.engine.broker.config.recovery.deferred_retry);
				}
			}
		};
	};
