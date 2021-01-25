import Rascal from 'rascal';

import { exchanges, vhost, connection, triggers } from './constants';

const queue = 'combase:events';

const queues = {
	[queue]: {
		assert: true,
		check: true,
		options: {
			durable: true,
		},
	}
};

let bindings = {};
let subscriptions = {};

bindings[`events[*.*] -> ${queue}`] = {};
bindings[`retry[*.*] -> ${queue}`] = {};

	
for (const trigger of triggers) {
	subscriptions[trigger] = {
		vhost,
		queue,
		contentType: 'application/json',
		redeliveries: {
			limit: 5,
			counter: 'shared',
		},
	};
}

export const consumerConfig = Rascal.withDefaultConfig({
	vhosts: {
		[vhost]: {
			connection,
			exchanges,
			queues: {
				...queues,
				'combase:delay:1m': {
					assert: true,
					options: {
						arguments: {
							// Configure messages to expire after 1 minute, then route them to the retry exchange
							'x-message-ttl': 60000,
							'x-dead-letter-exchange': 'retry',
						},
					},
				},
				'combase:dead_letter:q1': {
					assert: true,
				},
			},
			bindings: {
				...bindings,
				// Route delayed messages to the 1 minute delay queue
				'delay[delay.1m] -> combase:delay:1m': {},
				// Route retried messages back into the events queue using the CC routing keys set by Rascal
				// Route dead letters the dead letter queue
				'dead_letter[*.*] -> combase:dead_letter:q1': {},
			},
			subscriptions: {
				...subscriptions,
			},
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