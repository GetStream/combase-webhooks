import zendesk from 'node-zendesk';

export const createZendeskClient = (credentials) => {
	const { user: username, api_token: token, subdomain } = credentials;

	const client = zendesk.createClient({
		username: `${username}`,
		token,
		remoteUri: `https://${subdomain}.zendesk.com/api/v2`
	});

	return client;
}