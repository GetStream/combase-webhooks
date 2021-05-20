import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'

const analytics = Analytics({
	app: 'combase',
	plugins: [
	  googleAnalytics({
		trackingId: 'UA-197461081-1', // TODO - move inside the handler and grab tracking id from org integration creds
	  })
	]
  });

export const trackChatEvent = async (event) => {
	const { data: { body }, trigger } = event;
	
	const user = body.user || body.message?.user || body?.channel?.created_by;

	/* Track event in GA with the trigger string as the event name */
	await analytics.track(trigger, {
		createdAt: body.created_at,
	});
	
	/* Identify the user */
	if (user) {
		await analytics.identify(user.id, {
			combaseId: user.id,
			name: user.name,
			email: user.email,
		});
	}
};