import express from 'express';
import gql from 'graphql-tag';
import { html, safeHtml } from 'common-tags';
import { graphql, logger } from 'utils';

import { createHTML } from './createHTML';

const router = express.Router();

/**
 * Returns the Integration Manifest for Zendesk to initialize the Channel Integration when installed.
 */
router.get('/channel/manifest', (req, res) => {
	res.status(200).json({
		"name": "Combase Channel",
		"id": "combase-channel-1a2b3c",
		"author":  "Stream",
		"version": "0.0.5",
		"channelback_files": true,
		"create_followup_tickets": false,
		"push_client_id": "combase_by_stream",
		"urls": {
			"admin_ui": "https://combase-webhooks.ngrok.io/zendesk/channel/admin-ui",
			"pull_url": "https://combase-webhooks.ngrok.io/zendesk/channel/pull",
			"channelback_url": "https://combase-webhooks.ngrok.io/zendesk/channel/channelback"
		}
	})
});

/**
 * Returns the Admin UI for creating the link between Zendesk and Combase accounts.
 */
router.post('/channel/admin-ui', (req, res) => {
	const {
		instance_push_id,
		locale,
		metadata,
		name,
		return_url,
		state,
		subdomain,
		zendesk_access_token,
	} = req.body;
	
	const fields = [
		['organization_id', ''],
		['subdomain', subdomain, 'hidden'],
		['return_url', return_url, 'hidden'],
		['zendesk_access_token', zendesk_access_token, 'hidden'],
		['instance_push_id', instance_push_id, 'hidden'],
	];

	// TODO: Get users login creds for Combase so we can auth the request to our api - currently not required in dev.

	const body = html`
		<h1>Combase ❤️ Zendesk</h1>
		<p>Authorize your combase account with Zendesk below.</p>
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

/**
 * Responsible for validating the data from the Admin UI and passing it up to Zendesk to be stored as a metadata (sent in with future requests from Zendesk)
 */
router.post('/channel/confirm', async (req, res) => {
	const { 
		instance_push_id,
		zendesk_access_token,
		return_url, 
		subdomain, 
		organization_id 
	} = req.body;

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

		const record = {
			name:"Zendesk",
			enabled: true,
			credentials: [
				{
					name: "subdomain",
					value: subdomain
				},
				{
					name: "instance_push_id",
					value: instance_push_id
				},
				{
					name: "access_token",
					value: zendesk_access_token,
				}
			],
			triggers: ["zendesk.pull", "zendesk.channelback", "zendesk.clickthrough"],
			organization: organization_id,
		}

		// TODO: If updating the integration in Zendesk - this should be integrationUpdate...
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

/**
 * Handles Pull Requests for Data from Zendesk
 */
router.post('/channel/pull', (req, res) => {
	logger.info('received PR from zendesk')
	res.status(200).json({
		external_resources: [],
		state: {
			last_pull: Date.now(),
		}
	});
});

/**
 * Handle receiving channelback events from Zendesk.
 */
router.post('/channel/channelback', async (req, res) => {
	try {
		const { metadata, message, parent_id: ticketId } = req.body;
	
		const { organization_id } = JSON.parse(metadata);

		const { organization } = await graphql.request(
			gql`
				query getTicket($_id: MongoID!) {
					organization {
						ticket(_id: $_id) {
							agents
						}
					}
				}
			`,
			{
				_id: ticketId
			},
			{
				['combase-organization']: organization_id
			}
		);

		const [agent] = organization.ticket.agents;

		const {ticketSendMessage} = await graphql.request(
			gql`
				mutation sendMessageFromZendesk($ticket: MongoID!, $text: String!, $agent: MongoID) {
					ticketSendMessage(ticket: $ticket, text: $text, agent: $agent)
				}
			`,
			{
				ticket: ticketId,
				text: message,
				agent,
			},
			{
				['combase-organization']: organization_id
			}
		); 

		res.status(200).json({
			external_id: ticketSendMessage.message.id,
			allow_channelback: true,
		});
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({
			error: error.message || "Internal Server Error"
		});
	}
});

export default router;