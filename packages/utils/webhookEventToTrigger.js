export const webhookEventToTrigger = (data) => {
	console.log('create trigger for:', data);
	
	return 'email.receive';
};