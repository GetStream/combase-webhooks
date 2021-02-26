import 'dotenv/config';
import eventTypes from '../eventTypes.json';

export const allGroups = Object.keys(eventTypes);
export const triggers = allGroups.flatMap((group) => {
	const triggerGroup = eventTypes[group];
	if (Array.isArray(triggerGroup)) {
		return eventTypes[group].map(op => `${group}.${op}`)
	} else {
		return Object.keys(eventTypes[group]).flatMap((subgroup) => eventTypes[group][subgroup].map(op => `${group}:${subgroup}.${op}`))
	}
});

export const exchanges = {
	'events': { // events exchange
		type: 'x-message-deduplication', // Follow steps here to install the required plugin. - https://github.com/noxdafox/rabbitmq-message-deduplication
		options: {
			arguments: {
				'x-cache-size': 1000,
				'x-cache-ttl': 3600000
			}
		}
	},
	'delay': {}, // To delay failed messages before a retry
	'retry': {}, // To retry failed messages up to maximum number of times
	'dead_letter':{}, // When retrying fails, messages end up here
}

export const recovery = {
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
}

export const redeliveries = {
	counters: {
		shared: {
			size: 20,
			type: 'inMemory',
		},
	},
}

export const vhost = process.env.AMQP_VHOST;
export const connection = process.env.AMQP_CONNECTION_URL;

