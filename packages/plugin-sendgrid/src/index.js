import jwt from 'jsonwebtoken';

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
		query ($agent: MongoID!) {
			agent(_id: $agent) {
				name {
					display
				}
			}

			organization {
				name
			}
		}
	`, { agent: invitation.from })
	
	const { agent, organization } = data;
	const { name: orgName } = organization;
	const { name: { display: agentName } } = agent;
	const iat = Math.round(new Date(invitation.createdAt).valueOf() / 1000);

	const token = jwt.sign({
		org: invitation.organization,
		iat,
		exp: iat + 86400,
		email: invitation.to,
		access: invitation.access,
	}, process.env.AUTH_SECRET);

	const url = `https://support.combase.app/invite/?token=${token}`;

	const emailData = {
		to: invitation.to,
		from: `${orgName} Support • Combase <no-reply@em8259.parse.combase.app>`,
		subject: `${agentName} invited you to join ${orgName} on Combase.`,
		text: `${agentName} invited you to the ${orgName} organization in Combase. Join now: ${url}`,
		html: `<p>${agentName} invited you to the ${orgName} organization in Combase.</p><br/><p>Join now: <a href="${url}">Click here</a></p>`
	};

	await email.sendMail(emailData);

	log.info(`✉️  Sent ${event.trigger} Email: ${invitation.to} • ${orgName}`);
};

export const requestPasswordReset = async (event, { gql, log, request, email }) => {
	const { _id, name, email: to, organization } = event.data.body;
	const iat = Math.round(new Date().valueOf() / 1000);

	const token = jwt.sign({
		org: organization,
		iat,
		exp: iat + 86400,
		sub: _id,
	}, process.env.AUTH_SECRET);

	const url = `https://support.combase.app/new-password/?token=${token}`;

	const emailData = {
		to,
		from: `Support • Combase <no-reply@em8259.parse.combase.app>`,
		subject: `Change your password`,
		text: `Text`,
		html: `${url}`
	};

	await email.sendMail(emailData);
};
