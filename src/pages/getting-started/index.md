---
title: Express API Authentication
description: Learn how to authenticate requests to Express API.
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

Use this guide once you have credentials from the Developer Console. If you still need to create a project, add **Adobe Express API**, or pick Web App, SPA, or Server-to-Server, follow **[Create credentials](../create-credentials/)** first.

## Overview

Express API uses **OAuth 2.0**. Every request must include:

- `Authorization: Bearer <access_token>`
- `X-API-KEY: <client_id>` (API key from the Developer Console)

How you obtain `<access_token>` depends on your credential type (user-based vs server-to-server). Those options are summarized under [Choose authentication type](../create-credentials/index.md#choose-authentication-type) in the create-credentials guide.

## Prerequisites

* Credentials from your admin or your own [Adobe Developer Console](https://developer.adobe.com/) project with **Adobe Express API** configured — see [Create credentials](../create-credentials/)
* **Client ID** (API key); for OAuth Web App and Server-to-Server you also use the **client secret** where applicable

## Get an access token

### User authentication (OAuth Web App or SPA)

The user signs in with their Adobe ID and consents to your app. Use the OAuth 2.0 **authorization code** flow (Web App) or **PKCE** (SPA). Implementation steps are in Adobe’s [User authentication](https://developer.adobe.com/developer-console/docs/guides/authentication/UserAuthentication/) documentation; Console setup for Express API is in [Create credentials – User Authentication](../create-credentials/index.md#user-authentication).

You can sanity-check Web App credentials with a sample such as [this OAuth 2.0 Web App client](https://github.com/theManikJindal/adobe-oauth-web-app-client).

<InlineAlert variant="help" slots="text" />

Include scopes such as: `ee.express_api`, `openid`, `AdobeID` (match the scope set your project requires).

### Server-to-server (OAuth Server-to-Server)

The backend uses the `client_credentials` grant; there is no interactive user. Console setup, token generation, product profiles, and **technical account** access to documents and assets (sharing, Storage administrator, troubleshooting) are documented in one place: [Create credentials – Server-to-Server Authentication](../create-credentials/index.md#server-to-server-authentication-1).

## Call the Express API

Send these headers on every request:

| Header | Value |
| ------ | ----- |
| `Authorization` | `Bearer <access_token>` |
| `X-API-KEY` | `<client_id>` |

Tokens expire; refresh or re-issue them according to Adobe’s documentation for your credential type.

### Example: list tagged documents

Endpoint: [/alpha/tagged-documents](../../../api/alpha-tagged-documents/)

```bash
curl -i -X GET \
  'https://express-api.adobe.io/alpha/tagged-documents?start=0&limit=5&sortBy=name' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'X-API-KEY: <CLIENT_ID>'
```

Example response shape:

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
