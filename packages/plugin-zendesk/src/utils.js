import zendesk from 'node-zendesk';

export const createZendeskClient = (integration) => {
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
