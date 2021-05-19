import Hubspot from 'hubspot';

export const onChannelCreated = async (event, {gql, log, request}) => {
	// TODO: Get API Key, Portal ID and "combase" property name from integration in mongo
	// TODO: Also add setup instructions for the above in about.md
	const hubspot = new Hubspot({ 
		apiKey: 'API_KEY_HERE'
	});

	try {
		const { user } = event.data.body;
		log.info('hubspot fired');

		const properties = [
			{
				property: "email",
				value: user.email, 
			},
			{
				property: "combase",
				value: true, 
			}
		];

		const [firstname, lastname] = user.name.split(' ').map(part => part?.trim?.() || "");

		properties.push({ 
			property: "firstname",
			value: firstname, 
		})

		if (lastname) {
			properties.push({ 
				property: "lastname",
				value: lastname, 
			})
		}

		await hubspot.contacts.create({
			properties	
		});

	} catch (error) {
		log.error(error.message);
	}
};