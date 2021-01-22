import eventTypes from '../eventTypes.json';

export const allGroups = Object.keys(eventTypes);
export const triggers = allGroups.flatMap((group) => eventTypes[group].map(op => `${group}.${op}`));

export const vhost = process.env.CLOUD_AMQP_VHOST;
export const connection = `amqps://${vhost}:${process.env.CLOUD_AMQP_ID}.rmq.cloudamqp.com/${vhost}`;
