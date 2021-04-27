import { lookupIntegration } from 'utils';

/**
 * Handles "pull requests" from zendesk.
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const handlePull = async (event, actions) => {
	const { data, organization, trigger } = event; 
	const { gql, request, log } = actions;
	
	const integration = await lookupIntegration(event, actions);

	if (integration) {
		log.info(`${trigger} for org<${organization}>`);
	}
};

/**
 * Handles "channelback" events from zendesk.
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const handleChannelback = async (event, actions) => {
	const { data, organization, trigger } = event; 
	const { gql, request, log } = actions;
	
	const integration = await lookupIntegration(event, actions);

	if (integration) {
		log.info(`${trigger} for org<${organization}>`);
	}
};

/**
 * Handles "clickthrough" events from zendesk.
 * 
 * @param {*} event 
 * @param {*} actions 
 */
export const handleClickthrough = async (event, actions) => {
	const { data, organization, trigger } = event; 
	const { gql, request, log } = actions;
	
	const integration = await lookupIntegration(event, actions);

	if (integration) {
		log.info(`${trigger} for org<${organization}>`);
	}
};

