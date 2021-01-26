export const combaseWebhookParser = ({ body, query }) => ({
	organization: body.to.split('@')[0],
	trigger: query.trigger || 'email.receive',
});