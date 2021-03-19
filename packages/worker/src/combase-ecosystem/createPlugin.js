import { emailTransport, graphql, logger } from 'utils';
import gql from 'graphql-tag';

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
				gql,
				log: logger,
				request: (document, variables) => graphql.request(document, variables, this.authenticateRequest(event)),
				emailTransport,
			};
		}

		listen = async () => {
			for await (const [event, ackOrNack] of this.capn.listen(this.triggers)) {
				try {
					if (typeof this[event.trigger] === 'function') {
						await this[event.trigger](event, this.actions(event));
						console.log(event.trigger)
						ackOrNack();
					} else if (Array.isArray(this[event.trigger])) {
						await Promise.all(this[event.trigger].map(fn => fn(event, this.actions(event))));
						ackOrNack();
					} else {
						throw new Error(`${event.trigger} • event was not consumed`)
					}
				} catch (error) { 
					const canRetry = typeof this[event.trigger] !== 'undefined';
					if (canRetry) {
						ackOrNack(error, this.capn.engine.broker.config.recovery.deferred_retry);
					} else {
						ackOrNack(error, this.capn.engine.broker.config.recovery.dead_letter);
					}
				}
			}
		};
	};
