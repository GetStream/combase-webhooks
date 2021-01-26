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
				log: logger,
				request: (document, variables) => graphql.request(document, variables, this.authenticateRequest(event)),
			};
		}

		listen = async () => {
			let i = 0;
			for await (const [event, ackOrNack] of this.capn.listen(this.triggers)) {
				try {
					if (typeof this[event.trigger] === 'function') {
						await this[event.trigger](event, this.actions(event));
						ackOrNack();
					} else if (Array.isArray(this[event.trigger])) {
						await Promise.all(this[event.trigger].map(fn => fn(event, this.actions(event))));
						ackOrNack();
					} else {
						const canRetry = typeof this[event.trigger] !== 'undefined';
						const message = canRetry ? 'Something went wrong.' : `No plugins listening for ${event.trigger}`;
						throw new Object({ canRetry, message });
					}
				} catch (error) { 
					logger.error(error.message)
					if (error?.canRetry) {
						// TODO: Currently just throws the message to the deferred_retry recovery strategy - we should check the error and conditionally send to dead_letter immediately if applicable.
						ackOrNack(error, this.capn.engine.broker.config.recovery.deferred_retry);
					} else {
						ackOrNack(error, this.capn.engine.broker.config.recovery.dead_letter);
					}
				}
			}
		};
	};
