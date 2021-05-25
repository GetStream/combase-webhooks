import { integrationFinder, parseCredentials } from '@combase.app/integration-finder';
import Hubspot from 'hubspot';

export const onChannelCreated = async (event, actions) => {
	const { log } = actions;
	try {
		const { user } = event.data.body;

		const integration = await integrationFinder('hubspot', event, actions);

		if (integration) {
			const credentials = parseCredentials(integration)

			// TODO: Get API Key, Portal ID and "combase" property name from integration in mongo
			// TODO: Also add setup instructions for the above in about.md
			const hubspot = new Hubspot({ 
				apiKey: credentials.apiKey
			});

			const properties = [
				{
					property: "email",
					value: user.email, 
				},
				{
					property: credentials.propertyName,
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
		}

		log.error(error.message);
	} catch (error) {
	}
};