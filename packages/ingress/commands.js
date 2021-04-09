import gql from 'graphql-tag';
import { graphql, logger } from 'utils';

import { mongo } from './mongo';

class ChatCommandsHandler {
	getEntitiesFromEvent = (body) => {
		const { message } = body;
		const { id: user, organization } = body.user;
		const [_, channelId] = message.cid.split(':');

		return {
			user,
			organization,
			ticket: channelId,
		}
	}

	tag = async (body) => {
		const { message } = body;

		const {
			organization,
			ticket,
			user
		} = this.getEntitiesFromEvent(body);

		const headers = {
			'combase-organization': organization,
		};
		
		const tags = message
			.args
			.split(',')
			.map((str) => str.trim())
			.filter(str => !!str)
			.map((tag) => 
				graphql.request(gql`
					mutation tagTicket($ticket: MongoID!, $tag: String!) {
						ticketAddTag(_id: $ticket, name: $tag)
					}
				`, { ticket, tag }, headers)
			);

		await Promise.all(tags);

		message.text = `Added ${tags?.length} tag${tags?.length === 1 ? '' : 's'} to this ticket.`;
		message.type = 'ephemeral';
		message.display = 'system';

		return message;
	};
	
	star = async (body) => {
		const { message } = body;

		const {
			organization,
			ticket,
			user
		} = this.getEntitiesFromEvent(body);

		const headers = {
			'combase-organization': organization,
		};
		
		await graphql.request(gql`
			mutation starTicket($ticket: MongoID!, $starred: Boolean!) {
				ticketStar(_id: $ticket, starred: $starred) {
					recordId
				}
				# TODO add create activity
			}
		`, { ticket, starred: true }, headers);

		message.text = `Ticket was starred`;
		message.type = 'ephemeral';
		message.display = 'system';

		return message;
	};

	priority = async (body) => {
		const { message } = body;

		const {
			organization,
			ticket,
			user
		} = this.getEntitiesFromEvent(body);

		const headers = {
			'combase-organization': organization,
		};

		const level = parseInt(message.args.trim(), 10);

		await graphql.request(gql`
			mutation ticketSetPriority($ticket: MongoID!, $level: Int!) {
				ticketSetPriority(_id: $ticket, level: $level) {
					recordId
				}
			}
		`, { ticket, level }, headers)

		const levels = ['none', 'medium', 'high']
		message.text = `Ticket priority level set to ${levels[level]}.`;
		message.type = 'ephemeral';
		message.display = 'system';

		return message;
	};

	transfer = async () => {
		return undefined;
	};

	mark = () => {
		return undefined
	};

	faq = () => {
		return undefined
	};

	middleware = async (req, res, next) => {
		const { type } = req.query;

		try {
			if (!type || typeof this[type] !== 'function') {
				throw new Error('Unrecognized command.');
			}

			const message = await this[type](req.body)
			
			if (!message) {
				throw new Error(`Something went wrong handling the ${type} command.`)
			}

			res.setHeader('Content-Type', 'application/json');
			res.end(
				JSON.stringify({
					message,
				})
			);
		} catch (error) {
			logger.error(error.message);
			res.sendStatus(400);
		}

		next();
	}
}

export const commands = new ChatCommandsHandler();