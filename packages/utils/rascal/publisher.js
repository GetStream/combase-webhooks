import Rascal from 'rascal';
import { v4 as uuid } from 'uuid';
import { exchanges, vhost, connection, recovery, redeliveries, triggers } from './constants';

let publications = {};

for (const trigger of triggers) {
	publications[trigger] = {
		exchange: 'events',
	};
}

export const publisherConfig = Rascal.withDefaultConfig({
	vhosts: {
		[vhost]: {
			connection,
			exchanges,
			publications: {
				...publications,
				'combase:retry': {
					exchange: 'delay',
					options: {
						CC: ['delay.1m'],
					},
				},
			}
		},
	},
	recovery,
	redeliveries,
});