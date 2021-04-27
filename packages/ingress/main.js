import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { html, safeHtml } from 'common-tags';
import gql from 'graphql-tag';

import { createPath, graphql, logger } from "utils";

import { capn } from "./capn";
import { commands } from "./commands";

const { PORT = 8081 } = process.env;

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());
app.use('/webhook', capn.use);

app.use('/chat-commands', commands.middleware);

app.get('/integration-definitions', (req, res) => {
	const integrations = fs.readFileSync(createPath([__dirname, '../../', '.data', 'integration-manifest.json']));
	
	return res.send(JSON.parse(integrations)).end();
});

app.use('/zendesk', express.static('zendesk'));

const createHTML = (body) => html`
	<!DOCTYPE html>
	<html>
	<head>
	<meta charset="utf-8">
	<!--   See Using Zendesk Garden:
		https://developer.zendesk.com/apps/docs/developer-guide/setup#using-zendesk-garden
		https://garden.zendesk.com/css-components/bedrock/
		https://garden.zendesk.com/css-components/utilities/typography/
	-->
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/combine/npm/@zendeskgarden/css-bedrock@7.0.21,npm/@zendeskgarden/css-utilities@4.3.0">
	</head>
	<body>
		${body}
	</body>
	</html>
`;

app.post('/zendesk/admin-ui.html', (req, res) => {
	const {
		locale,
		metadata,
		name,
		return_url,
		state,
		subdomain,
	} = req.body;
	
	console.log('metadata', metadata);
	const fields = [
		['organization_id', ''],
		['subdomain', subdomain, 'hidden'],
		['return_url', return_url, 'hidden'],
	];

	const body = html`
		<h1>Hello from <code>common-tags</code>!</h1>
		<form method="post" action="./confirm">
			${
				fields.map(([name, defaultValue, type = 'text']) => 
					html`<input type="${type}" value="${defaultValue}" name="${name}" />`
				)
			}
			<button type="submit">
				<span>Submit</span>
			</button>
		</form>
	`;

	res.send(createHTML(body));
});

app.post('/zendesk/confirm', async (req, res) => {
	const { return_url, subdomain, organization_id } = req.body;

	try {
		const getOrganization = await graphql.request(
			gql`
				query getOrganization {
					organization {
						name
					}
				}
			`,
			{},
			{
				['combase-organization']: organization_id
			}
		);

		// TODO: Create zendesk integration for the OrgID
		const record = {
			name:"Zendesk",
			enabled: true,
			credentials: [{
				name: "subdomain",
				value: subdomain
			}],
			triggers: ["zendesk.pull", "zendesk.channelback", "zendesk.clickthrough"],
			organization: organization_id,
		}

		const createIntegration = await graphql.request(
			gql`
				mutation createZendeskIntegration($record: CreateOneIntegrationInput!) {
					integrationCreate(record: $record) {
						record {
							_id
						}
					}
				}
			`,
			{
				record
			},
			{
				['combase-organization']: organization_id
			}
		);

		const { organization } = getOrganization;
		const { integrationCreate: { record: integration } } = createIntegration;

		const body = html`
			<form id="finish" method="post" action="${return_url}">
				<input type="hidden" name="name" value="${organization.name}" />
				<input type="hidden" name="metadata" value="${safeHtml`${JSON.stringify({"organization_id": organization_id, "integration_id": integration._id})}`}" />
			</form>
			<script type="text/javascript">
				// Post the form
				var form = document.forms['finish'];
				form.submit();
			</script>
		`;
		res.send(createHTML(body));
	} catch (error) {
		const errorBody = html`
			<h4>Could not connect to Combase at this time</h4>
			<p><b style="color: red;">Error:</b>${error.message}</p>
			<p>Please close the account configuration modal and try again.</p>
		`;
		
		res.send(createHTML(errorBody))
	}

})

await app.listen(PORT);

logger.info(`🚀 //:${PORT} • Combase Webhook Ingress 💬`);
