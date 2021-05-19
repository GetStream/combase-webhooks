import Hubspot from 'hubspot';

export const onChannelCreated = async (event, {gql, log, request}) => {
	const hubspot = new Hubspot({ 
		apiKey: 'API_KEY_HERE'
	});

	const { user } = data.body;

	await hubspot.contacts.create({
		properties: [
		  	{ 
				property: "name",
				value: user.name, 
			},
		  	{
				property: "email",
				value: user.email, 
			},
			{ 
				property: "source",
				value: "combase", 
			},
		]	
	});

	log.info('traacked...');
};