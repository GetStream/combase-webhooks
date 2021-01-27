import { GraphQLClient } from 'graphql-request';

export const graphql = new GraphQLClient(process.env.API_URL || 'http://localhost:8080/graphql');
