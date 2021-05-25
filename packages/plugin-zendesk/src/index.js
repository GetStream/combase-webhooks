import p from 'phin';
import { integrationFinder, parseCredentials } from '@combase.app/integration-finder';

/**
 * Create a new ticket in Zendesk when a ticket is created in Combase
 * chat:channel.created
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const pushToZendesk = async (event, actions) => {
	const { data } = event; 
	const { gql, request, log } = actions;

	const integration = await integrationFinder('zendesk', event, actions);
	
	if (integration) {
		const { channel_id, created_at, message, user } = data.body; // Stream channel.created payload.
		const {
			subdomain,
			access_token,
			instance_push_id,
		} = parseCredentials(integration);

		try {
			const { body: zendeskTicket } = await p({
				'method': 'POST',
				'timeout': 2000,
				parse: 'json',
				url: `https://${subdomain}.zendesk.com/api/v2/any_channel/push.json`,
				headers: {
					"Authorization": `Bearer ${access_token}`,
					"Content-Type": 'application/json'
				},
				data: {
					instance_push_id,
					external_resources: [{
						external_id: channel_id,
						message: message.text,
						html_message: message.html,
						created_at,
						author: {
							external_id: user.id,
							name: user.name,
							image_url: user.avatar,
						},
						allow_channelback: true,
					}]
				}
			});

			// await request(gql`
			// 	mutation updateTicketMeta($_id: MongoID!, $record: UpdateByIdTicketInput!) {
			// 		ticketUpdate(_id: $_id, record: $record) {
			// 			recordId
			// 		}
			// 	}
			// `, { _id: channel_id, record: { meta: { zendeskId: zendeskTicket.id } }  });
		} catch (error) {
			log.error(error.message);
		}
	}
};


/**
 * Create a new agent in Zendesk when a new Combase agent is created
 * agent.created
 * 
 * @param {*} event 
 * @param {*} actions 
 */
// export const syncAgentCreate = async (event, actions) => {
// 	const integration = await lookupIntegration(event, actions);

// 	const { data } = event; 
// 	const { gql, request, log } = actions;

// 	if (integration) {
// 		const client = createZendeskClient(integration);
// 		const { fullDocument: agent } = data.body;

// 		try {
// 			const zendeskAgent = await client.users.create({
// 				user: {
// 					name: agent.name.full,
// 					email: agent.email,
// 					role: 'agent',
// 					verified: true,
// 				}
// 			});

// 			await request(gql`
// 				mutation addAgentZendeskId($_id: MongoID!, $record: UpdateByIdAgentInput!) {
// 					agentUpdate(_id: $_id, record: $record) {
// 						record {
// 							meta
// 						}
// 					}
// 				}
// 			`, { 
// 				_id: agent._id, 
// 				record: { 
// 					meta: { 
// 						zendeskId: zendeskAgent.id,
// 					} 
// 				}
// 			});
// 		} catch (error) {
// 			log.error(error.message);
// 		}
// 	}
// };