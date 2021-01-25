import 'dotenv/config';
import { mongoOperationToTrigger } from './mongoOperationToTrigger';
import { webhookEventToTrigger } from './webhookEventToTrigger';

/** 
 * For Combase, all events must contain data.organization with the org id for the request 
 * Having this be the routers job allows us to grab the org id from different locations in the payload depending on the type of request:
 * A simple example is - we get the orgID from data.body.fullDocument.organization for changestream events - whereas webhook events may
 * contain the org id somewhere deep within the data ( e.g. SendGrid: `data.body.to.split('@')[0]` ).
 * 
 * ! the returned object (or every object of the returned array) should always contain a `trigger` property at the top-level. (i.e. event.trigger, not event.data.trigger)
 */
export class Router {
    validateTrigger = () => true;

    createEventFromChangeStream = ({ _id: _, clusterTime: __, operationType, ns: { coll: collectionName }, documentKey: { _id }, ...rest }) => {
        const trigger = mongoOperationToTrigger(collectionName, operationType);

        if (!trigger) {
            // eslint-disable-next-line no-console
            console.error(`Couldn't discern the correct event trigger from the ${operationType} event on the ${collectionName} collection.`);

            return;
        }

        if (trigger && !this.validateTrigger(trigger)) {
            // eslint-disable-next-line no-console
            console.error(`Generated trigger ${trigger} was not recognized as a valid Combase event trigger`);
        }

        return {
            data: {
                body: rest,
                _id,
			},
			organization: rest.fullDocument?.organization?.toString?.(),
            trigger,
        };
    };

    createEventFromWebhook = data => ({
        data: {
            body: data.body,
            query: data.query,
			headers: data.headers,
			source: data.source,
            originHost: data.get('origin') || data.get('host'),
		},
		organization: data.body.to.replace('@parse.combase.app', ''), // TODO: We need to grab this from the request itself. Doing it in the router allows us to discern the org id at the same time as the trigger.
        trigger: webhookEventToTrigger(data),
    });

    route = data => {
		let payload;

        switch (data.source) {
            case 'changestream':
                payload = this.createEventFromChangeStream(data);

                break;

            case 'webhook':
            default:
                payload = this.createEventFromWebhook(data);

                break;
        }

        /**
         * Router must return either a single event object,
         * or an array of event objects
         * Event objects must have a `type` property
         */

        return payload;
    };
}
