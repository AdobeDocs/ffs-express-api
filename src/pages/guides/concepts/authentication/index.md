---
title: Authentication
description: Learn how to authenticate requests to Express API
keywords:
  - Express API Authentication
  - Server-to-Server Authentication
  - OAuth
  - API Security
  - Access Tokens
  - Client ID
  - Client Secret
  - Identity Management
  - Secure API Access
  - Token-Based Authentication
  - Generate Access Token
  - Authentication Best Practices
contributors:
  - https://github.com/nimithajalal
hideBreadcrumbNav: true
---

# Authentication

Learn how to authenticate requests to Express API

## Overview

Express API uses encrypted access tokens to ensure secure communication between your application and our services. To get started, you'll need to authenticate your requests using your Client ID and Client Secret. These credentials initiate the user authentication flow, which provides an authorization code that you can exchange for an access token.

## Prerequisites

Before you begin, make sure you have:

* An [Adobe Developer Console](https://developer.adobe.com/) account
* A [project](https://developer.adobe.com/developer-console/docs/guides/projects/projects-empty/) with [Express API credentials](../create-credentials/) configured
* Your Client ID and Client Secret from the Adobe Developer Console project


## Retrieve an Access Token

You can retrieve an access token using [this OAuth 2.0 Web App Client](https://github.com/theManikJindal/adobe-oauth-web-app-client) to verify if credentials are set up rightly. Learn more about [creating credentials](../create-credentials/index.md).

<InlineAlert variant="help" slots="text" />

Enter scopes as: `ee.express_api`, `openid`, `AdobeID`

## Make an Authenticated API Request

<!--
<InlineAlert variant="warning" slots="text" />

If you are using [server-to-server authentication](../create-credentials/index.md#server-to-server-authentication-1), any documents that need to be accessed must be shared with the **technical account email address** shown in your credentials overview. Without this sharing permission, the generated access token won't be able to access the documents. 

![Finding the technical account email in credentials overview](../images/server-credentials.png)

To share a document with the technical account:
1. Open your document in Adobe Express
2. Click the Share button in the top right
3. Enter the technical account email address
4. Set the permission to "Can edit"
5. Click Share

![Sharing a document with technical account](../images/share-document.png)
-->

Let us call [/alpha/tagged-documents](../../../api/alpha-tagged-documents/)

```bash
curl -i -X GET 
  'https://express-api.adobe.io/alpha/tagged-documents?start=0&limit=5&sortBy=name' 
  -H 'Authorization: Bearer EXPRESS_CLIENT_SECRET' 
  -H 'X-API-KEY: EXPRESS_CLIENT_ID'
```

The response will look like this:

```json
{
"documents": [
{
  "id": "string",
  "name": "string",
  "thumbnailUrl": "string"
}
],
"paging": {
  "nextUrl": "string",
  "totalRecords": 0
}
}
```
