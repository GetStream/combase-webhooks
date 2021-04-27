/**
 * Checks that an integration exists for the authenticated Organization,
 * and that it is enabled.
 * 
 * Can be used by any plugin, just pass along all arguments from the trigger method.
 * If truthy, the Organization has a valid & enabled integration relating to the current event.
 * If falsy, we can safely ignore the incoming event. 
 * 
 * @param {*} event 
 * @param {*} actions 
 * @returns integration data
 */
export const lookupIntegration = async ({ organization, trigger }, { gql, log, request }) => {
	try {
		//? TODO: validate trigger again
		const data = await request(gql`
			query lookupIntegration($organization: MongoID!, $triggers: [String]) {
				integrationLookup(filter: {
					organization: $organization,
					_operators: {
						triggers: {
							in: $triggers
						}
					}
				}) {
					_id
					name
					enabled
					credentials {
						key: name
						value
					}
				}
			}
		`, 
			{
				organization,
				triggers: [trigger]
			}
		);

		if (data?.integrationLookup?.enabled) {
			return data?.integrationLookup;
		}

		return undefined;
	} catch (error) {
		log.error(error.message)
	}
}

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

