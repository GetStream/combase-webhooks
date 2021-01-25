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

export const vhost = '/';
export const connection = 'amqp://localhost:5672/';
// export const vhost = process.env.CLOUD_AMQP_VHOST;
// export const connection = `amqps://${vhost}:${process.env.CLOUD_AMQP_ID}.rmq.cloudamqp.com/${vhost}`;
