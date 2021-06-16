export const receiveEmail = async (event, { gql, log, request }) => {
	const {user} = await request(gql`
		mutation ($record: UserInput!) {
			user: getOrCreateUser(record: $record) {
				_id
			}
		}
	`, 
		{
			record: {
				email: event.data.body.envelope ? JSON.parse(event.data.body.envelope).from : '',
				name: event.data.body.from,
			}
		}
	);

	const data = await request(gql`
		mutation ($message: String, $user: MongoID!) {
			ticket: createTicket(message: $message, user: $user) {
				_id
			}
		}
	`, {
		message: event.data.body.text,
		user: user._id.toString(),
	});
	
	log.info(`🎟  Created Ticket ${data.ticket._id.toString()}`)
};

// TODO: Fix up issue with Sendgrid and uncomment this.
export const sendEmail = async (event, { gql, log, request, emailTransport }) => {

	const data = await request(gql`
		query ($agent: MongoID!) {
			organization {
				name
			}
			
			agent(_id:$agent) {
				name {
					display
				}
				email
			}
		}
	`, { agent: event.data.body.fullDocument.agents[0] })
	
	const { name } = data.organization
	
	const orgName = `${name.charAt(0).toUpperCase()}${name.slice(1)} Support`;
	const to = `${data.agent.name.display} <${data.agent.email}>`;
	
	log.info(`✉️  Sent ${event.trigger} Email: ${to} • ${orgName}`);
};

export const sendInvitation = async (event, { gql, log, request, email }) => {
	const { fullDocument: invitation } = event.data.body;

	const data = await request(gql`
		{
			organization {
				name
			}
		}
	`)
	
	const { name } = data.organization
	
	const orgName = `${name.charAt(0).toUpperCase()}${name.slice(1)} Support`;

	const emailData = {
		to: invitation.to,
		from: `no-reply@em8259.parse.combase.app`,
		subject: 'Support Query',
		text: 'Awesome sauce',
		html: '<b>Awesome sauce</b>'
	};

	await email.sendMail(emailData);

	log.info(`✉️  Sent ${event.trigger} Email: ${invitation.to} • ${orgName}`);
};
