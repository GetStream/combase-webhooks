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
export const lookupIntegration = async ({ organization, trigger }, { gql, request }) => {
	//TODO: validate trigger again??
	const data = await request(gql`
		query lookupIntegration($organization: MongoID!, $triggers: JSON!) {
			integrationLookup(organization: $organization, triggers: $triggers) {
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
}