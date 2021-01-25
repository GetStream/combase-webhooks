import Rascal from 'rascal';
import { v4 as uuid } from 'uuid';
import { exchanges, vhost, connection, triggers } from './constants';

let publications = {};

for (const trigger of triggers) {
	publications[trigger] = {
		exchange: 'events',
	};
}

export const publisherConfig = Rascal.withDefaultConfig({
	vhosts: {
		[vhost]: {
			connection,
			exchanges,
			publications: {
				...publications,
				'combase:retry': {
					exchange: 'delay',
					options: {
						CC: ['delay.1m'],
					},
				},
			}
		},
	},
	// Define recovery strategies for different error scenarios
	recovery: {
		// Deferred retry is a good strategy for temporary (connection timeout) or unknown errors
		deferred_retry: [
			{
				strategy: 'forward',
				attempts: 5,
				publication: 'combase:retry',
				xDeathFix: true, // See https://github.com/rabbitmq/rabbitmq-server/issues/161
			},
			{
				strategy: 'nack',
			},
		],

		/*
		* Republishing with immediate nack returns the message to the original queue but decorates
		* it with error headers. The next time Rascal encounters the message it immediately nacks it
		* causing it to be routed to the services dead letter queue
		*/
		dead_letter: [
			{
				strategy: 'republish',
				immediateNack: true,
			},
		],
	},
	// Define counter(s) for counting redeliveries
	redeliveries: {
		counters: {
			shared: {
				size: 20,
				type: 'inMemory',
			},
		},
	},
});