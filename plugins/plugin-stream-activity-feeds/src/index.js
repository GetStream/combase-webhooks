/**
 * Tickets
 */
export const onTicketCreated = (event, { gql, request }) => {
	const { fullDocument } = event.data.body;
    try {
        const organizationId = fullDocument.organization;
        const userId = fullDocument.user.toString();
        const ticketId = fullDocument._id.toString();

        const userFeed = `user:${userId}`;
        const ticketFeed = `ticket:${ticketId}`;
        const organizationFeed = `organization:${organizationId}`;

        const activity = {
            actor: userId,
            object: ticketId,
            entity: 'Ticket',
            text: 'New Ticket',
            verb: event.trigger,
        };

        return request(gql`
            mutation createTicketCreatedActivity($userFeed: StreamID!, $organizationFeed: StreamID!, $ticketFeed: StreamID!, $activity: StreamAddActivityInput!) {
                userFollowTicket: follow(feed: $userFeed, toFollow: $ticketFeed) {
                    id
                }

                orgFollowTicket: follow(feed: $organizationFeed, toFollow: $ticketFeed) {
                    id
                }

                addActivity(feed: $ticketFeed, activity: $activity) {
                    id
                }
            }
        `, {
            userFeed,
            organizationFeed,
            ticketFeed,
            activity,
        })
    } catch (error) {
        console.error(error);
    }
};

export const onTicketAssigned = (event, { gql, request }) => {
	const { fullDocument } = event.data.body;

    const organizationId = event.organization;
    const ticketId = fullDocument._id.toString();

    const ticketFeed = `ticket:${ticketId}`;

    const baseActivity = {
        object: ticketId,
        entity: 'Ticket',
        verb: event.trigger,
    };

	const agentId = fullDocument.agents[0].toString();
	const activity = {
		...baseActivity,
		object: agentId,
		entity: 'Agent',
		text: 'Assigned Ticket',
		actor: organizationId, // "Org Bot" assigns the ticket.
	};

	return request(
		gql`
			mutation createTicketCreatedActivity($ticketFeed: StreamID!, $activity: StreamAddActivityInput!) {
				addActivity(feed: $ticketFeed, activity: $activity) {
					id
				}
			}
		`,
		{
			ticketFeed,
			activity,
		}
	)
}

export const onTicketUnassigned = (event, { gql, request }) => {
	const { fullDocument } = event.data.body;

    const organizationId = event.organization;
    const ticketId = fullDocument._id.toString();

    const ticketFeed = `ticket:${ticketId}`;

    const baseActivity = {
        object: ticketId,
        entity: 'Ticket',
        verb: event.trigger,
    };

	const activity = {
		...baseActivity,
		text: 'Missed Ticket',
		actor: organizationId,
	};

	return request(
		gql`
			mutation createTicketCreatedActivity($ticketFeed: StreamID!, $activity: StreamAddActivityInput!) {
				addActivity(feed: $ticketFeed, activity: $activity) {
					id
				}
			}
		`,
		{
			ticketFeed,
			activity,
		}
	);
}

/**
 * Users
 */

/**
 * Creates a 'created' activity on the users feed, and makes sure the organization
 * is following the newly created user.
 */
export const onUserCreated = (event, { gql, request }) => {
	const { fullDocument } = event.data.body;

    const organizationId = event.organization;
    const userId = fullDocument._id.toString();

    const organizationFeed = `organization:${organizationId}`;
    const userFeed = `user:${userId}`;

	const activity = {
		object: userId,
        entity: 'User',
        verb: event.trigger,
		text: 'was created.', // TODO: We should do these in the FE based on the verb rather than hardcode them into stream.
		actor: organizationId,
	};

	return request(
		gql`
			mutation createUserCreatedActivity($organizationFeed: StreamID!, $userFeed: StreamID!, $activity: StreamAddActivityInput!) {
				addActivity(feed: $userFeed, activity: $activity) {
					id
				}

                orgFollowUser: follow(feed: $organizationFeed, toFollow: $userFeed) {
                    id
                }
			}
		`,
		{
            organizationFeed,
			userFeed,
			activity,
		}
	);
}

/**
 * Agents
 */

/**
 * Creates a 'created' activity on the agents feed, and makes sure the organization
 * is following the newly created agent.
 */
export const onAgentCreated = (event, { gql, request }) => {
	const { fullDocument } = event.data.body;

    const organizationId = event.organization;
    const agentId = fullDocument._id.toString();

    const organizationFeed = `organization:${organizationId}`;
    const agentFeed = `agent:${agentId}`;

	const activity = {
		object: agentId,
        entity: 'Agent',
        verb: event.trigger,
		text: 'was created.', // TODO: We should do these in the FE based on the verb rather than hardcode them into stream.
		actor: organizationId,
	};

	return request(
		gql`
			mutation createAgentCreatedActivity($organizationFeed: StreamID!, $agentFeed: StreamID!, $activity: StreamAddActivityInput!) {
				addActivity(feed: $agentFeed, activity: $activity) {
					id
				}

                orgFollowAgent: follow(feed: $organizationFeed, toFollow: $agentFeed) {
                    id
                }
			}
		`,
		{
            organizationFeed,
			agentFeed,
			activity,
		}
	);
}
