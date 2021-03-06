import gql from 'graphql-tag';
import { graphql } from './graphql';

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
	} else if (query.trigger.startsWith('zendesk.')) {
		organization = body?.metadata ? JSON.parse(body.metadata).organization_id : undefined;
		trigger = query.trigger;
	}

	return {
		organization: organization || query.organization,
		trigger: trigger || query.trigger,
	}
};