import gql from 'graphql-tag';
import { graphql } from './graphql';
// TODO: Ticket created is being caught rn from changestreams and used for routing - this should com from the chat webhooks - we need to catch them below and create event from stream chat webhooks
export const combaseWebhookParser = async ({ headers, body, query }) => {
	let organization;
	let trigger;

	if (headers['target-agent'] === 'Stream Webhook Client') {
		trigger = `chat:${body.type}`;
		organization  = body.channel.organization;
	} else if (query.id || headers['content-type'].startsWith('application/x-www-form-urlencoded') && body.id) {
		const id = query.id || body.id;
		// fetch integration from mongo with the integration id.
		// can get the org id from here.
		const data = await graphql.request(
			gql`
				query ($id: MongoID!) {
					integration(_id: $id) {
						name
						organization
						enabled
					}
				}
			`,
			{ id },
		);
		
		if (!data?.integration) {
			throw new Error('Could not find corresponding integration.')
		}

		if (data?.integration.enabled) {
			organization = data?.integration?.organization.toString();
			trigger = data?.integration?.name;
		}

	} else if (query.trigger === 'sendgrid.receive') {
		organization = body.to.split('@')[0];
		trigger = 'email.receive';
	}

	return {
		organization: organization || query.organization,
		trigger: trigger || query.trigger,
	}
};