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
export const integrationFinder = async (uid, { data: { organization } }, { gql, log, request }) => {
	try {
		const data = await request(gql`
			query lookupIntegration($organization: MongoID, $uid: String!) {
				integrationLookup(organization: $organization, uid: $uid) {
					_id
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
				uid,
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
 * Maps the decrypted credential values back into a standard key/value pair object.
 */
export const parseCredentials = (integration) => {
	let obj = {};
	integration.credentials.forEach(({ key, value }) => {
		obj[key] = value
	});
	return obj;
};