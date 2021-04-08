export const createTicket = async ({ data, organization, trigger }, { gql, request, log }) => {
	const {name, email, message, ticketID} = data.body;

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
				message,
				meta: [{ event: trigger, foreignID: ticketID }]
			},
			user: {
				email,
				name,
			},
		}
	);
};
