import gql from 'graphql-tag';
import { graphql, logger } from 'utils';

class ChatCommandsHandler {
	tag = () => {
		return undefined
	};
	
	star = async (body) => {
		const { message } = body;
		const { id: user, organization } = body.user;

		const [cid] = message.id?.split?.('-');
		const headers = {
			'combase-organization': organization.toString(),
		};

		console.log('channel id', cid)

		await graphql.request(gql`
			mutation starTicket($cid: MongoID!) {
				ticketAddLabel(ticket: $cid, label: starred) {
					_id
				}
			}
		`, { cid }, headers);

		console.log('star conversation', `user: ${user}`, `organization: ${organization}`);

		message.text = `Ticket was starred`;
		message.type = 'ephemeral';
		message.display = 'system';

		return message;
	};

	priority = () => {
		return undefined
	};

	transfer = () => {
		return undefined
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