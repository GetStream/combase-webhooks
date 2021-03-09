import 'dotenv/config';
import { triggers  } from './rascal/constants';
import { mongoOperationToTrigger } from './mongoOperationToTrigger';
import { combaseWebhookParser } from './combaseWebhookParser';
import { logger } from './logger';

/** 
 * For Combase, all events must contain data.organization with the org id for the request 
 * Having this be the routers job allows us to grab the org id from different locations in the payload depending on the type of request:
 * A simple example is - we get the orgID from data.body.fullDocument.organization for changestream events - whereas webhook events may
 * contain the org id somewhere deep within the data ( e.g. SendGrid: `data.body.to.split('@')[0]` ).
 * 
 * ! the returned object (or every object of the returned array) should always contain a `trigger` property at the top-level. (i.e. event.trigger, not event.data.trigger)
 * 
 * ! The router is only used on the ingress.
 */
export class Router {
    validateTrigger = (trigger) => {
		if (!trigger) {
            // eslint-disable-next-line no-console
            throw new Error(`No event trigger found.`);
        }

        if (trigger && !triggers.includes(trigger)) {
            // eslint-disable-next-line no-console
            throw new Error(`Generated trigger ${trigger} was not recognized as valid by any Combase event publication.`);
        }

		return trigger;
	};

    createEventFromChangeStream = ({ _id: _, clusterTime: __, operationType, ns: { coll: collectionName }, documentKey: { _id }, ...rest }) => {
		try {
			const trigger = mongoOperationToTrigger(collectionName, operationType, rest);
			this.validateTrigger(trigger);

			return {
				data: {
					body: rest,
					_id,
				},
				organization: rest.fullDocument?.organization?.toString?.(),
				trigger,
			};

		} catch (error) {
			return null;
		}
    };

    createEventFromWebhook = async data => {
		try {
			const eventMeta = await combaseWebhookParser(data);

			this.validateTrigger(eventMeta?.trigger)
			
			return {
				data: {
					body: data.body,
					query: data.query,
					headers: data.headers,
					source: data.source,
					originHost: data.get('origin') || data.get('host'),
				},
				...eventMeta,
			}
		} catch (error) {
			return null;
		}
	};

    route = async data => {
		let payload;

        switch (data.source) {
            case 'changestream':
                payload = this.createEventFromChangeStream(data);

                break;

            default:
                payload = await this.createEventFromWebhook(data);

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
