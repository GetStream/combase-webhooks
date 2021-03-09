import gql from 'graphql-tag';
import { graphql } from './graphql';
// TODO: Ticket created is being caught rn from changestreams and used for routing - this should com from the chat webhooks - we need to catch them below and create event from stream chat webhooks
export const combaseWebhookParser = async ({ headers, body, query }) => {
	let organization;
	let trigger;
	

	if (headers['target-agent'] === 'Stream Webhook Client') {
		trigger = `chat:${body.type}`;
		organization  = body.channel ? body.channel.organization : body.user.organization;
	} else if (query.id) {
		const {id} = query;
		// fetch integration from mongo with the integration id.
		// can get the org id from here.
		const data = await graphql.request(
			gql`
				query ($id: MongoID!) {
					integration(_id: $id) {
						triggers
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
			trigger = data?.integration?.triggers?.[0];
		}

	} else if (query.trigger === 'sendgrid.receive') {
		organization = body.to.split('@')[0];
		trigger = 'email.receive';
	}
	console.log(organization, trigger);
	return {
		organization: organization || query.organization,
		trigger: trigger || query.trigger,
	}
};