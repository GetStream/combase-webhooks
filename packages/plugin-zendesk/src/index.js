import p from 'phin';
import { integrationFinder, parseCredentials } from '@combase.app/integration-finder';

import { createZendeskClient } from './utils';

/**
 * Endpoint to push content to zendesk through a zendesk channel integration.
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const pushToZendesk = async (event, actions) => {
	const { data } = event; 
	const { gql, request, log } = actions;

	const integration = await integrationFinder('zendesk', event, actions);

	if (integration) {
		const { ticket: _id } = data.body; // Stream channel.created payload.

		const {ticket} = await request(
			gql`
				query getTicket($_id: MongoID!) {
					ticket(_id: $_id) {
						createdAt
						subject
						user: userData {
							_id
							name
							email
						}
					}
				}
			`,
			{ _id }
		);

		const {
			subdomain,
			access_token,
			instance_push_id,
		} = parseCredentials(integration);

		try {
			const {body: zendeskBody} = await p({
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
						external_id: _id,
						message: ticket.subject,
						created_at: ticket.createdAt,
						author: {
							external_id: ticket.user._id,
							name: ticket.user.name,
						},
						allow_channelback: true,
					}]
				}
			});

			if (zendeskBody.error) {
				console.error(zendeskBody.error);
			}

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
 * Create a new ticket in Zendesk
 * chat:channel.created
 * 
 * @param {*} event 
 * @param {*} actions 
 */
 export const escalateToZendesk = async (event, actions) => {
	const integration = await integrationFinder('zendesk', event, actions);

	const { data } = event; 
	const { gql, request, log } = actions;

	if (integration) {
		const credentials = parseCredentials(integration);
		const client = createZendeskClient(credentials);
		const { ticket: _id } = data.body;

		try {
			const {ticket} = await request(
				gql`
					query getTicket($_id: MongoID!) {
						ticket(_id: $_id) {
							createdAt
							subject
							messages
							agents
							user: userData {
								_id
								name
								email
								meta
							}
						}
					}
				`,
				{ _id }
			);

			const user = ticket.user;
			let existingUserId = user?.meta?.zendeskId;

			if (!existingUserId) {
				const zendeskUser = await client.users.create({
					user: {
						name: user.name,
						email: user.email,
						role: 'end-user',
						verified: true,
					}
				});

				await request(gql`
					mutation addUserZendeskId($_id: MongoID!, $record: UpdateByIdUserInput!) {
						userUpdate(_id: $_id, record: $record) {
							record {
								name
								meta
							}
						}
					}
				`, { 
					_id: user._id, 
					record: { 
						meta: { 
							zendeskId: zendeskUser.id,
						} 
					}
				});

				existingUserId = zendeskUser.id;
			}

			const body = ticket.messages?.length ? ticket.messages.filter(({ type }) => type !== 'system').reduce((acc, { user, text }) => ([...acc, `${user.name}<${user.email}>:\n${text}`]), ['Original Transcript from Combase: \n\n']).join('\n\n') : ticket.subject;

			const zendeskTicket = await client.tickets.create({
				"ticket": {
					"subject": ticket.subject,
					"comment": {
						"body": body
					},
					"external_id": _id,
					"tags": ["combase"],
					"submitter_id": existingUserId,
					"requester_id": existingUserId,
				},
			});

			await request(gql`
				mutation updateTicketMeta($_id: MongoID!, $record: UpdateByIdTicketInput!, $agent: MongoID!, $text: String!) {
					ticketUpdate(_id: $_id, record: $record) {
						recordId
					}
					ticketSendMessage(agent: $agent, ticket: $_id, text: $text)
				}
			`, { 
				_id,
				text: '/markas closed',
				agent: ticket.agents[0],
				record: { 
					meta: { 
						zendeskId: zendeskTicket.id 
					},
				}
			});
		} catch (error) {
			log.error(error.message);
		}
	}
};