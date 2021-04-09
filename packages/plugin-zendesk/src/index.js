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
		const { channel } = data.body;
		
		let obj = {};
		credentials.forEach(({ key, value }) => {
			obj[key] = value
		});
		const { user, token, subdomain } = obj;

		const client = zendesk.createClient({
			username:  user,
			token:     token,
			remoteUri: `https://${subdomain}.zendesk.com/api/v2`
		});

		try {
			const ticket = {
				"ticket": {
					"subject":"New Ticket",
					"comment": {
						"body": "Ticket created by Combase"
					}
				}
			};
			await client.tickets.create(ticket);
		} catch (error) {
			log.error(error.message);
		}
	}
};