import zendesk from 'node-zendesk';

export const createZendeskClient = (integration) => {
	let obj = {};
	integration.credentials.forEach(({ key, value }) => {
		obj[key] = value
	});
	const { user: username, access_token: token, subdomain, instance_push_id } = obj;
	console.log("CREDS", obj);
	const client = zendesk.createClient({
		username: 'luke+zendesk@smetham.dev',
		token,
		oauth: true,
		remoteUri: `https://${subdomain}.zendesk.com/api/v2`
	});

	return client;
}