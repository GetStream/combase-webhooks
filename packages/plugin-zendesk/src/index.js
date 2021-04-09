import zendesk from 'node-zendesk';

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
				meta: [{ event: trigger, foreignID: ticketID }]
			},
			user: {
				email,
				name,
			},
		}
	);
};

export const syncTicket = async ({ data, organization, trigger }, { gql, request, log }) => {
	const response = await request(gql`
		query lookupIntegration($filter: FilterFindOneIntegrationInput!) {
			integrationLookup(filter: $filter) {
				_id
				name
				credentials {
					key: name
					value
				}
			}
		}
	`, 
		{
			filter: {
				organization,
				_operators: {
					triggers: {
						in: ["zendesk:ticket.new"]
					}
				}
			},
		}
	);

	if (response?.integrationLookup) {
		const { credentials } = response?.integrationLookup
		
		let obj = {};
		credentials.forEach(({ key, value }) => {
			obj[key] = value
		});
		const { user: username, token, subdomain } = obj;

		const client = zendesk.createClient({
			username,
			token,
			remoteUri: `https://${subdomain}.zendesk.com/api/v2`
		});

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
				`, { _id: data.body.user.id, record: { meta: { zendeskId: user.id } }  });

				existingUserId = user.id;
			}

			const ticket = {
				"ticket": {
					"subject": "New Ticket",
					"comment": {
						"body": "Ticket created by Combase"
					},
					"submitter_id": existingUserId,
					"requester_id": existingUserId,
				},
			};
			await client.tickets.create(ticket);
		} catch (error) {
			log.error(error.message);
		}
	}
};