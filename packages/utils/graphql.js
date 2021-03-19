import 'dotenv/config';
import { GraphQLClient } from 'graphql-request';

export const graphql = new GraphQLClient(process.env.API_URL || 'https://combase-api.ngrok.io/graphql');
