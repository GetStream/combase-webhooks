import Rascal from 'rascal';

import { exchanges, vhost, connection, recovery, redeliveries, triggers } from './constants';

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
				// Route dead letters to the dead letter queue
				'dead_letter[*.*] -> combase:dead_letter:q1': {},
			},
			subscriptions: {
				...subscriptions,
			},
			publications: {
				'combase:retry': {
					exchange: 'delay',
					options: {
						CC: ['delay.1m'],
					},
				},
			}
		},
	},
	recovery,
	redeliveries,
});