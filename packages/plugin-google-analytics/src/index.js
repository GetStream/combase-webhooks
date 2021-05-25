import {integrationFinder, parseCredentials} from '@combase.app/integration-finder';
import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'

export const trackChatEvent = async (event, actions) => {
	const { data: { body }, trigger } = event;
	
	const user = body.user || body.message?.user || body?.channel?.created_by;

	const integration = await integrationFinder('google-analytics', event, actions);

	if (integration) {
		const credentials = parseCredentials(integration);

		const analytics = Analytics({
			app: 'combase',
			plugins: [
			  googleAnalytics(credentials)
			]
		  });
	
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
	}
};