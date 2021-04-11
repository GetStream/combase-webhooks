import {createZendeskClient} from './utils';

/**
 * Checks that an integration exists for the authenticated Organization,
 * and that it is enabled.
 * 
 * @param {*} event 
 * @param {*} actions 
 * @returns integration data
 */
export const lookupIntegration = async ({ organization  }, { gql, request }) => {
	//TODO: validate trigger again??
	const data = await request(gql`
		query lookupIntegration($organization: MongoID!, $triggers: JSON!) {
			integrationLookup(organization: $organization, triggers: $triggers) {
				_id
				name
				enabled
				credentials {
					key: name
					value
				}
			}
		}
	`, 
		{
			organization,
			triggers: ["zendesk:ticket.new"]
		}
	);

	if (data?.integrationLookup?.enabled) {
		return data?.integrationLookup;
	}
}

/**
 * Create a new ticket in Combase when a ticket is created in Zendesk, also does a find or create on the 
 * user via their email address.
 * zendesk:ticket.new
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const createTicket = async ({ data, organization, trigger }, { gql, request, log }) => {
	const {name, email, message, ticketID} = data.body;

	const parts = message.split(/\n/g);
	const text = parts.slice(3).join('\n\n');

	log.info(`☎️  Zendesk Event from User: ${name} <${email}> for Org: ${organization}`);

	return request(gql`
		mutation ($record: CreateTicketInput!, $user: UserInput!) {
			ticketCreate(record: $record, user: $user) {
				recordId
			}
		}
	`, 
		{
			record: {
				message: text,
				meta: { 
					zendeskId: ticketID 
				}
			},
			user: {
				email,
				name,
			},
		}
	);
};

/**
 * Create a new ticket in Zendesk when a ticket is created in Combase
 * chat:channel.created
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const syncTicketCreate = async (event, actions) => {
	const integration = await lookupIntegration(event, actions);

	const { data } = event; 
	const { gql, request, log } = actions;

	if (integration) {
		const { channel, user } = data.body; // Stream channel.created payload.
		const client = createZendeskClient(integration);

		try {
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
					_id: user.id, 
					record: { 
						meta: { 
							zendeskId: zendeskUser.id,
						} 
					}
				});

				existingUserId = zendeskUser.id;
			}

			const zendeskTicket = await client.tickets.create({
				"ticket": {
					"subject": "New Ticket",
					"comment": {
						"body": "Ticket created by Combase"
					},
					"submitter_id": existingUserId,
					"requester_id": existingUserId,
				},
			});

			await request(gql`
				mutation updateTicketMeta($_id: MongoID!, $record: UpdateByIdTicketInput!) {
					ticketUpdate(_id: $_id, record: $record) {
						recordId
					}
				}
			`, { _id: channel.id, record: { meta: { zendeskId: zendeskTicket.id } }  });
		} catch (error) {
			log.error(error.message);
		}
	}
};

/**
 * Create a new comment on the corresponding Zendesk ticket when a Combase message is sent
 * chat:message.new
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const syncTicketMessage = async (event, actions) => {
	const integration = await lookupIntegration(event, actions);

	const { data } = event; 
	const { gql, request, log } = actions;

	if (integration) {
		const client = createZendeskClient(integration);
		const { channel_id } = data.body; // stream message.new payload

		try {
			const {ticket} = await request(gql`
				query getTicket($_id: MongoID!) {
					ticket(_id: $_id) {
						meta
					}
				}
			`, { _id: channel_id });
			
			const { zendeskId: ticketZendeskId } = ticket.meta;
			
			let userZendeskId = data.body.user.meta?.zendeskId;
			
			if (!userZendeskId) {
				const users = await client.users.search({
					query: data.body.user.email,
				});

				const [result] = users;
				userZendeskId = result.id;
			}

			if (userZendeskId) {
				await client.tickets.update(ticketZendeskId, {
					"ticket": {
						"comment": {
							"author_id": userZendeskId,
							"body": data.body.message.text,
						},
					},
				});
			} else {
				log.error(`No Zendesk ID found for: <${data.body.user.email}>${data.body.user.id}`)
			}
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
export const syncAgentCreate = async (event, actions) => {
	const integration = await lookupIntegration(event, actions);

	const { data } = event; 
	const { gql, request, log } = actions;

	if (integration) {
		const client = createZendeskClient(integration);
		const { fullDocument: agent } = data.body;

		try {
			const zendeskAgent = await client.users.create({
				user: {
					name: agent.name.full,
					email: agent.email,
					role: 'agent',
					verified: true,
				}
			});

			await request(gql`
				mutation addAgentZendeskId($_id: MongoID!, $record: UpdateByIdAgentInput!) {
					agentUpdate(_id: $_id, record: $record) {
						record {
							meta
						}
					}
				}
			`, { 
				_id: agent._id, 
				record: { 
					meta: { 
						zendeskId: zendeskAgent.id,
					} 
				}
			});
		} catch (error) {
			log.error(error.message);
		}
	}
};