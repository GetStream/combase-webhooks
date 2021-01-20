import 'dotenv/config';
import Rascal from 'rascal';

import { mongoOperationToTrigger } from './mongoOperationToTrigger';

const vhost = process.env.CLOUD_AMQP_VHOST;
const connection = `amqps://${vhost}:${process.env.CLOUD_AMQP_ID}.rmq.cloudamqp.com/${vhost}`;

/**
 * CaptainHook router to parse incoming events into the correct event queues by return an object or array of objects that include a trigger property.
 * The trigger property is then used as the routingKey in RabbitMQ/Rascal. 
 */
export class Router {
    validateTrigger = () => true;

    createEventOperationChangeStream = ({ _id: _, clusterTime: __, operationType, ns: { coll: collectionName }, documentKey: { _id }, ...rest }) => {
        const trigger = mongoOperationToTrigger(collectionName, operationType);

        if (!trigger) {
            // eslint-disable-next-line no-console
            console.error(`Couldn't discern the correct event trigger from the ${operationType} event on the ${collectionName} collection.`);

            return;
        }

        if (trigger && !this.validateTrigger(trigger)) {
            // eslint-disable-next-line no-console
            console.error(`Generated trigger ${trigger} was not recognized as a valid Combase event trigger`);
        }

        return {
            data: {
                body: rest,
                _id,
            },
            trigger,
        };
    };

    createEventFromWebhook = data => ({
        data: {
            body: data.body,
            query: data.query,
            headers: data.headers,
            originHost: data.get('origin') || data.get('host'),
        },
        trigger: 'capn.event',
    });

    route = data => {
        let payload;

        switch (data.source) {
            case 'changestream':
                payload = this.createEventOperationChangeStream(data);

                break;

            case 'webhook':
            default:
                payload = this.createEventFromWebhook(data);

                break;
        }

        /**
         * Router must return either a single event object,
         * or an array of event objects
         * Event objects must have a `type` property
         */

        return payload;
    };

	static createRascalConfig() {
		return Rascal.withDefaultConfig({
			vhosts: {
				[vhost]: {
					connection,
					exchanges: [
						'events', // events queue
						'delay', // To delay failed messages before a retry
						'retry', // To retry failed messages up to maximum number of times
						'dead_letters', // When retrying fails, messages end up here
					],
					queues: {
						'capn:events:q1': {
							assert: true,
							check: true,
							options: {
								durable: true,
							},
						},
						'capn:delay:1m': {
							assert: true,
							options: {
								arguments: {
									// Configure messages to expire after 1 minute, then route them to the retry exchange
									'x-message-ttl': 60000,
									'x-dead-letter-exchange': 'retry',
								},
							},
						},
						'capn:dead_letters:q1': {
							assert: true,
						},
					},
					bindings: {
						// Route all events messages to the Capn Events queue
						'events[*.*] -> capn:events:q1': {},
						// Route delayed messages to the 1 minute delay queue
						'delay[delay.1m] -> capn:delay:1m': {},
						// Route retried messages back into the events queue using the CC routing keys set by Rascal
						'retry[*.*] -> capn:events:q1': {},
						// Route dead letters the dead letter queue
						'dead_letters[*.*] -> capn:dead_letters:q1': {},
					},
					publications: {
						'capn:event': {
							exchange: 'events',
						},
						'capn:retry': {
							exchange: 'delay',
							options: {
								CC: ['delay.1m'],
							},
						},
					},
					subscriptions: {
						'capn:event': {
							vhost,
							queue: 'capn:events:q1',
							contentType: 'application/json',
							redeliveries: {
								limit: 5,
								counter: 'shared',
							},
						},
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
						publication: 'capn:retry',
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
						size: 10,
						type: 'inMemory',
					},
				},
			},
		});
	}
}
