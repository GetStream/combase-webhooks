import { html, safeHtml } from 'common-tags';

export const createHTML = (body) => html`
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