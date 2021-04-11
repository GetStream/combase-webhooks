import zendesk from 'node-zendesk';

const createZendeskClient = (integration) => {
	let obj = {};
	integration.credentials.forEach(({ key, value }) => {
		obj[key] = value
	});
	const { user: username, token, subdomain } = obj;

	const client = zendesk.createClient({
		username,
		token,
		remoteUri: `https://${subdomain}.zendesk.com/api/v2`
	});

	return client;
}


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

export const syncTicketCreate = async ({ data, organization, trigger }, { gql, request, log }) => {
	const response = await request(gql`
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

	if (response?.integrationLookup?.enabled) {
		const client = createZendeskClient(response?.integrationLookup);

		try {
			let existingUserId = data.body.user?.meta?.zendeskId;
			log.info(`USER: ${existingUserId}`);

			if (!existingUserId) {
				const user = await client.users.create({
					user: {
						name: data.body.user.name,
						email: data.body.user.email,
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
					_id: data.body.user.id, 
					record: { 
						meta: { 
							zendeskId: user.id,
						} 
					}
				});

				existingUserId = user.id;
			}

			const ticket = await client.tickets.create({
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
			`, { _id: data.body.channel.id, record: { meta: { zendeskId: ticket.id } }  });
		} catch (error) {
			log.error(error.message);
		}
	}
};

export const syncTicketMessage = async ({ data, organization, trigger }, { gql, request, log }) => {
	const response = await request(gql`
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

	if (response?.integrationLookup) {
		const client = createZendeskClient(response?.integrationLookup);
		const { channel_id } = data.body;

		try {
			const {ticket} = await request(gql`
				query getTicket($_id: MongoID!) {
					ticket(_id: $_id) {
						meta
					}
				}
			`, { _id: channel_id });
			
			const { zendeskId: ticketZendeskId } = ticket.meta;
			const users = await client.users.search({
				query: data.body.user.meta.zendeskId,
			});

			console.log(users);
			const [{ id: userZendeskId }] = users;

			await client.tickets.update(ticketZendeskId, {
				"ticket": {
					"comment": {
						"body": data.body.message.text,
					},
					"submitter_id": userZendeskId,
					"requester_id": userZendeskId,
				},
			});
		} catch (error) {
			log.error(error.message);
		}
	}
};

export const syncAgentCreate = async ({ data, organization, trigger }, { gql, request, log }) => {
	log.info(JSON.stringify(data));
	const response = await request(gql`
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

	if (response?.integrationLookup) {
		const client = createZendeskClient(response?.integrationLookup);
		const { fullDocument: agentDoc } = data.body;
		try {
			const agent = await client.users.create({
				user: {
					name: agentDoc.name.full,
					email: agentDoc.email,
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
				_id: agentDoc._id, 
				record: { 
					meta: { 
						zendeskId: agent.id,
					} 
				}
			});
		} catch (error) {
			log.error(error.message);
		}
	}
};