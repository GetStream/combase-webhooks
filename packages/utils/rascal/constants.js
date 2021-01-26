import eventTypes from '../eventTypes.json';

export const allGroups = Object.keys(eventTypes);
export const triggers = allGroups.flatMap((group) => eventTypes[group].map(op => `${group}.${op}`));

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

export const vhost = '/';
export const connection = 'amqp://localhost:5672/';
// export const vhost = process.env.CLOUD_AMQP_VHOST;
// export const connection = `amqps://${vhost}:${process.env.CLOUD_AMQP_ID}.rmq.cloudamqp.com/${vhost}`;