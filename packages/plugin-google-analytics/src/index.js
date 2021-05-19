import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'

const analytics = Analytics({
	app: 'awesome-app',
	plugins: [
	  googleAnalytics({
		trackingId: 'UA-197461081-1', // TODO - move inside the handler and grab tracking id from org integration creds
	  })
	]
  })

export const onChannelCreated = async (event, {gql, log, request}) => {
	const { trigger, data } = event;
	const { user } = data.body;
	
	/* Track a custom event */
	await analytics.track(trigger, {
		createdAt: data.body.created_at,
	})
	
	/* Identify a visitor */
	await analytics.identify(user.id, {
		combaseId: user.id,
		name: user.name,
		email: user.email,
	});

	log.info('traacked...')
};