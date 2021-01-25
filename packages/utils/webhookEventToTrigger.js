export const webhookEventToTrigger = (data) => {
	let trigger;

	if (data.query.webhook) {
		// Handle Webhook ID:
		// Go to mongo
	} else if (data.query.trigger) {
		trigger = data.query.trigger || 'email.receive';
	}

	return trigger;
};