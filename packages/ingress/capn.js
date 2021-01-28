import 'dotenv/config';
import { Router, publisherConfig } from 'utils';
import { CaptainHook } from '@captain-hook/core';
import { CaptainRascalEngine } from '@captain-hook/rascal-engine';
import { createChangeStreamSource } from '@captain-hook/source-changestreams';

import { mongo } from './mongo';

const router = new Router();
const engine =  await CaptainRascalEngine.create(publisherConfig, true);

export const capn = new CaptainHook({
    engine,
    router: router.route,
	sources: [
		createChangeStreamSource([
			mongo.connection.db.collection('users').watch(undefined, { fullDocument: 'updateLookup' }),
			mongo.connection.db.collection('tickets').watch(undefined, { fullDocument: 'updateLookup' }),
			mongo.connection.db.collection('organizations').watch(undefined, { fullDocument: 'updateLookup' }),
		])
	]
});
