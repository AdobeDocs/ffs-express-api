---
title: Self-Service Variation Workflow with Server-to-Server
description: Build a self-service workflow where end users pick from a catalog of company-owned tagged Express templates, generate a variation server-side with OAuth Server-to-Server, and edit the result in Adobe Express.
keywords:
  - Adobe Express
  - Adobe Express API
  - Server-to-Server
  - OAuth S2S
  - client_credentials
  - Self-service
  - Generate variation
  - Tagged documents
  - Company templates
  - Shared project
contributors:
  - https://github.com/undavide
hideBreadcrumbNav: true
---

# Generate and Edit a Variant (Server-to-Server)

This guide walks through a complete end-to-end workflow using OAuth Server-to-Server authentication, covering a catalog of company-owned templates, variation generation, and final editing in Adobe Express.

## Overview

In this workflow, we present a Server-to-Server scenario where:

1. The organization owns a small catalog of tagged Express templates that are shared with the **technical account** of the Server-to-Server credential.
2. End users browse that shared catalog inside your app—no per-user OAuth sign-in.
3. Your backend generates a variation server-side using the technical account's access token.
4. The variation lands in an Express **project shared with the end user**, so they can open it natively in Adobe Express and keep editing.

This pairs naturally with the [OAuth Web App workflow](./e2e-generate-edit-variant-oauth.md): use OAuth when each user works on their own templates and the variation should land in their personal **My Stuff**; use Server-to-Server when the company curates the templates and you want a single backend integration to drive variation creation.

## Prerequisites

<InlineAlert variant="info" slots="text" />

Steps 1–5 below (token, list templates, inspect tags, generate, poll) work without any Admin Console setup—they run against the technical account's own storage and the templates you've directly shared with it. Only step 6 (the end user opening the variation in Adobe Express to edit) requires the shared-project setup described under _Admin Console setup_.

### Developer / template-author setup

You can complete all of this yourself, no admin rights required:

- An Adobe Developer Console project with the **Adobe Express API** added and an [OAuth Server-to-Server credential](../../getting-started/create-credentials/index.md#server-to-server).
- Your `client_id` (API key), `client_secret`, and the **technical account email**—all visible on the credential overview page.
- Scopes such as `openid`, `AdobeID`, `ee.express_api` (match the scope set your project requires; some orgs also need `read_organizations`). For the canonical token request and scope guidance, see [Getting started with Adobe Firefly Services](https://developer.adobe.com/firefly-services/docs/guides/get-started/).
- At least one tagged Express template **shared with the technical account**. In Adobe Express, open the doc → **Share** → paste the technical account email → **Can edit**. Tag elements with the [Tag Elements add-on](https://adobesparkpost.app.link/TR9Mb7TXFLb?mode=private&claimCode=wjmj67nj9:PLYN7XLJ).
- Node.js 18+ (or any backend that can do an HTTPS POST).

### Admin Console setup (one-time, requires an Adobe org admin)

Needed only for the final hand-off, where the end user opens the variation in Adobe Express:

- An Express **project** shared with the technical account (Can edit) **and** with the end-user accounts that will edit the variations. Project access is managed by an organization admin.
- The **project URN** (visible in the project URL inside Adobe Express, or in the Admin Console project settings). You will pass this URN as `projectId` in step 4 so that variations land inside the shared project—not in the technical account's private storage. Without a `projectId`, end users won't see the variations.
- The right entitlements on the technical account—Express product profile and, where applicable, **Storage administrator** and Enterprise Storage. See the _Grant the technical account access to documents and assets_ section of [Create credentials – Server-to-Server](../../getting-started/create-credentials/index.md#server-to-server) for the authoritative guidance.

The cURL and Python tabs in the steps below assume you already have an `ACCESS_TOKEN` from the Server-to-Server flow in the [first step](#1-get-a-server-to-server-access-token). Tokens are typically valid for ~24 hours. Unlike the OAuth Web App flow, **your backend refreshes the token** by re-issuing the same `client_credentials` request before it expires—the end user is never prompted to sign in.

## 1. Get a Server-to-Server access token

Unlike the OAuth Web App flow, there is no user redirect. Your backend asks Adobe IMS directly for an access token using the `client_credentials` grant. **This call must be server-side** because it includes your `client_secret`.

<CodeBlock slots="heading, code" repeat="3" languages="bash, javascript, python" />

#### cURL

```bash
curl -s -X POST 'https://ims-na1.adobelogin.com/ims/token/v3' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$CLIENT_ID" \
  --data-urlencode "client_secret=$CLIENT_SECRET" \
  --data-urlencode 'scope=openid,AdobeID,ee.express_api'
```

#### JavaScript (Node 18+)

```js
const body = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  scope: 'openid,AdobeID,ee.express_api',
});

const resp = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});
const tokens = await resp.json();
// tokens: { access_token, expires_in, token_type, ... }
```

#### Python

```python
import os, requests

resp = requests.post(
    "https://ims-na1.adobelogin.com/ims/token/v3",
    data={
        "grant_type": "client_credentials",
        "client_id": os.environ["CLIENT_ID"],
        "client_secret": os.environ["CLIENT_SECRET"],
        "scope": "openid,AdobeID,ee.express_api",
    },
)
tokens = resp.json()
```

Cache `access_token` in memory (or your secret store) until `Date.now() + (expires_in - 60) * 1000`. The token is org-scoped—every request below runs as the technical account, not as an end user. Keep both `client_secret` and the access token on the server.

## 2. List company templates

With the access token, list the templates available to the technical account. Send `Authorization: Bearer <ACCESS_TOKEN>` and `X-API-KEY: <CLIENT_ID>` (the same client ID from your credential).

The response includes any document the technical account owns or has been shared on—i.e. your company-curated catalog, since you control which templates get shared with that account.

<InlineAlert variant="warning" slots="text" />

In a real app you should never call `https://express-api.adobe.io` directly from the browser; keep the access token and `client_secret` on the server and expose your own thin proxy routes (e.g. `/api/templates`, `/api/generate`) that forward to Adobe. The [companion sample app](https://github.com/AdobeDocs/express-api-samples) shows this pattern end to end.

<CodeBlock slots="heading, code" repeat="3" languages="bash, javascript, python" />

#### cURL

```bash
curl -s 'https://express-api.adobe.io/beta/tagged-documents?start=0&limit=25&sortBy=-modifiedDate' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-API-KEY: $CLIENT_ID"
```

#### JavaScript (fetch)

```js
const resp = await fetch(
  'https://express-api.adobe.io/beta/tagged-documents?start=0&limit=25&sortBy=-modifiedDate',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-API-KEY': clientId,
    },
  }
);
const { documents, paging } = await resp.json();
```

#### Python

```python
resp = requests.get(
    "https://express-api.adobe.io/beta/tagged-documents",
    params={"start": 0, "limit": 25, "sortBy": "-modifiedDate"},
    headers={
        "Authorization": f"Bearer {access_token}",
        "X-API-KEY": client_id,
    },
)
data = resp.json()
```

Response shape:

```json
{
  "documents": [
    {
      "id": "urn:aaid:sc:EU:e6723...",
      "name": "Express API Sample Template.express",
      "thumbnailUrl": "https://aep-cs-blobstore-prod-irl1-data..."
    }
  ],
  "paging": {
    "totalRecords": 1,
    "nextUrl": ""
  }
}
```

The API does not currently support filtering by tag name or category server-side, so the "share with the technical account" convention _is_ your catalog filter. If you need finer control (for example, a single tech account with templates for several teams), use a name prefix and filter client-side.

Render each document's `thumbnailUrl` and `name` as a card and let the user click one. Keep the `id`—you need it for steps 3 and 4.

![List the company's tagged templates](./images/e2e-generate-edit-variant--list-template.png)

## 3. Inspect the template's tagged elements

Before the user can fill in tag values, your UI needs to know what tags the template actually has. Call `GET /beta/tagged-documents/{id}` for the selected document.

<CodeBlock slots="heading, code" repeat="3" languages="bash, javascript, python" />

#### cURL

```bash
curl -s "https://express-api.adobe.io/beta/tagged-documents/$DOCUMENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-API-KEY: $CLIENT_ID"
```

#### JavaScript (fetch)

```js
const resp = await fetch(
  `https://express-api.adobe.io/beta/tagged-documents/${encodeURIComponent(documentId)}`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-API-KEY': clientId,
    },
  }
);
const detail = await resp.json();
```

#### Python

```python
import urllib.parse
url = f"https://express-api.adobe.io/beta/tagged-documents/{urllib.parse.quote(document_id, safe='')}"
detail = requests.get(url, headers={
    "Authorization": f"Bearer {access_token}",
    "X-API-KEY": client_id,
}).json()
```

The response lists each page and its `taggedElements`. The `type` of each tag tells you what input to render: `text` accepts a plain string; `image` and `video` accept a pre-signed URL on an allowed domain (AWS, Dropbox, Azure).

This endpoint is paginated by page: append `?start=<n>` to fetch tagged elements starting at page `n` if the template has more pages than the default page size returns.

```json
{
  "id": "urn:aaid:sc:EU:e6723...",
  "name": "Express API Sample Template.express",
  "documentPages": [
    {
      "pageNumber": 1,
      "pageTitle": "",
      "size": { "width": 662, "height": 289 },
      "taggedElements": [
        {
          "name": "title", "type": "text",
          "position": { "x": 209, "y": 185 },
          "size": { "width": 662, "height": 289 }
        },
        {
          "name": "product-image", "type": "image",
          "position": { "x":  346, "y":  -131 },
          "size": { "width": 493, "height": 963 }
        }
      ],
      "thumbnailUrl": "https://aep-cs-blobstore-prod-irl1-data..."
    }
  ]
}
```

![Inspect the template's tagged elements](./images/e2e-generate-edit-variant--tag-details.png)

## 4. Generate the variation

Submit the user's values as `tagMappings`. The keys are the tag names from step 3; the values are strings (text) or pre-signed URLs (images, videos). The request shape is identical to the OAuth flow—only the bearer token and `projectId` differ.

Set `variationDetails.projectId` to the URN of the **shared project** from the [Admin Console setup](#prerequisites). This is what makes the variation visible to the end users you've shared that project with; omit it and the variation lands in the technical account's own `Express API Documents` folder, where end users have no access. `projectId` is optional in the OpenAPI spec but effectively required for this workflow.

<CodeBlock slots="heading, code" repeat="3" languages="bash, javascript, python" />

#### cURL

```bash
curl -s -X POST 'https://express-api.adobe.io/beta/generate-variation' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-API-KEY: $CLIENT_ID" \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "'"$DOCUMENT_ID"'",
    "variationDetails": {
      "preferredDocumentName": "Apple green",
      "projectId": "'"$SHARED_PROJECT_ID"'",
      "tagMappings": {
        "title": "APPLE GREEN",
        "product-image": "https://uc4fcd1dc97e1127dcb839ff192c.dl..."
      }
    }
  }'
```

#### JavaScript (fetch)

```js
const resp = await fetch('https://express-api.adobe.io/beta/generate-variation', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'X-API-KEY': clientId,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: documentId,
    variationDetails: {
      preferredDocumentName: 'Apple green',
      projectId: sharedProjectId,
      tagMappings: {
        title: 'APPLE GREEN',
        'product-image': 'https://uc4fcd1dc97e1127dcb839ff192c.dl...',
      },
    },
  }),
});
const { jobId, statusUrl } = await resp.json();
```

#### Python

```python
resp = requests.post(
    "https://express-api.adobe.io/beta/generate-variation",
    headers={
        "Authorization": f"Bearer {access_token}",
        "X-API-KEY": client_id,
        "Content-Type": "application/json",
    },
    json={
        "id": document_id,
        "variationDetails": {
            "preferredDocumentName": "Apple green",
            "projectId": shared_project_id,
            "tagMappings": {
                "title": "APPLE GREEN",
                "product-image": "https://uc4fcd1dc97e1127dcb839ff192c.dl...",
            },
        },
    },
)
job = resp.json()
```

Response (HTTP 202):

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "statusUrl": "https://express-api.adobe.io/status/af121560-218e-4dd9-918d-add12b3b6d98"
}
```

The variation is created by the technical account. With a valid `projectId` and the Admin Console setup from [Prerequisites](#prerequisites) in place, it lands in the **shared project** and is visible to the end users you've shared that project with. Omit `projectId` and it lives in the technical account's own `Express API Documents` folder instead—fine for validating steps 1–5, but the end user won't be able to open it in step 6.

Hold on to `jobId` for the next step.

![Filled out tag mappings](./images/e2e-generate-edit-variant--filled-tag-details.png)

## 5. Poll the job

`GET /status/{jobId}` returns `running` until the variation is ready, then `succeeded` (or `failed`/`partially_succeeded`). Poll every few seconds.

<CodeBlock slots="heading, code" repeat="3" languages="bash, javascript, python" />

#### cURL

```bash
curl -s "https://express-api.adobe.io/status/$JOB_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-API-KEY: $CLIENT_ID"
```

#### JavaScript (fetch)

```js
async function pollJob(jobId, accessToken, clientId) {
  while (true) {
    const r = await fetch(`https://express-api.adobe.io/status/${encodeURIComponent(jobId)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-API-KEY': clientId,
      },
    }).then((r) => r.json());
    if (['succeeded', 'failed', 'partially_succeeded'].includes(r.status)) return r;
    await new Promise((res) => setTimeout(res, 3000));
  }
}
```

#### Python

```python
import time

def poll_job(job_id, access_token, client_id):
    while True:
        r = requests.get(
            f"https://express-api.adobe.io/status/{job_id}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-API-KEY": client_id,
            },
        ).json()
        if r["status"] in ("succeeded", "failed", "partially_succeeded"):
            return r
        time.sleep(3)
```

When the job succeeds, you get the new document back:

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "status": "succeeded",
  "document": {
    "id": "urn:aaid:sc:EU:3da...",
    "name": "Apple green",
    "thumbnailUrl": "https://...signed-url..."
  }
}
```

![Variation created](./images/e2e-generate-edit-variant--variant-created.png)

## 6. Open the variation with the Adobe Express Embed SDK

The newly created document can be opened in Adobe Express, deep-linking to it via its URN:

```text
https://express.adobe.com/id/<DOCUMENT_URN>
```

Render that as a button on your success view:

```html
<a href="https://express.adobe.com/id/urn:aaid:sc:EU:3da..."
   target="_blank" rel="noopener">
  Open in Adobe Express &rarr;
</a>
```

Or you can open it inside your own application using the Adobe Express Embed SDK. The Embed SDK exposes an **Editor Workflow** with an [`edit()`](https://developer.adobe.com/express/embed-sdk/docs/v4/sdk/src/workflows/3p/editor-workflow/classes/editor-workflow#edit) method that takes the same `documentId` (the variation URN returned in step 5) and renders Adobe Express directly in your page.

<InlineAlert variant="info" slots="heading, text" />

#### Embed SDK and Server-to-Server Client IDs

The Embed SDK and the Server-to-Server credential rely on **different Client IDs**. The Embed SDK is user-facing and authenticates the end user against an OAuth credential—it does not use your Server-to-Server credential. To embed the editor, add an **OAuth Web App** (or **OAuth Single-page App**) credential to the same Developer Console project; the `clientId` you pass to `CCEverywhere.initialize` is that user-facing credential's `client_id`, not your S2S `client_id`. The variation URN works the same way in either case.

### 6.1 Load and initialize the SDK

Load the SDK script, then call `CCEverywhere.initialize` once with the `clientId` from your OAuth Web App / SPA credential and an `appName` that matches the **Public App Name** you set in the Developer Console.

```html
<script type="module">
  await import('https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js');

  const hostInfo = {
    clientId: '<OAUTH_CLIENT_ID>',
    appName: 'My Variation App',
  };

  const configParams = {
    loginMode: 'delayed',
  };

  const { editor } = await window.CCEverywhere.initialize(hostInfo, configParams);
</script>
```

`loginMode: 'delayed'` lets the user start interacting with the embedded editor before they sign in; sign-in is only prompted when they save or export. Because the variation lives in the project that's shared with the end user (see [Prerequisites](#prerequisites)), once they sign in they have edit access to the document.

### 6.2 Open the variation for editing

Pass the variation URN from step 5 as `documentId` and call `editor.edit()`:

```js
const docConfig = { documentId: '<DOCUMENT_URN>' };
const appConfig = {};      // optional editor configuration
const exportConfig = [];   // optional export targets
editor.edit(docConfig, appConfig, exportConfig);
```

The Adobe Express editor opens in a modal (or in a container of your choice if you pass `containerConfig`). Because the variation was created in a project shared with the end user, they land directly inside the document and can keep editing it—no per-document share step is needed.

If the user lands on a "request access" or 404 screen instead (whether they used the deep link or the Embed SDK), the parent project isn't actually shared with their account. Revisit the _Admin Console setup_ in [Prerequisites](#prerequisites) and confirm:

- The technical account is a member of the project (Can edit).
- The end-user account is a member of the same project.
- The technical account has the right Express product profile and (where applicable) Storage administrator / Enterprise Storage entitlement.

For the full surface—`appConfig`, `exportConfig`, `containerConfig`, and the other editor entry points (`create`, `createWithAsset`, `createWithTemplate`)—see the [Adobe Express Embed SDK documentation](https://developer.adobe.com/express/embed-sdk/docs/guides/).

![Variation in Adobe Express](./images/e2e-generate-edit-variant--adobe-express.png)

## Next steps

- Run the full flow end to end with the [companion sample app](https://github.com/AdobeDocs/express-api-samples) (Node/Express backend + a single static HTML page, Server-to-Server variant).
- Need to skip the "open in Express" hand-off entirely and just give the user a finished asset? Add a [rendition export step](./export-document.md) right after step 5 to return a JPG/PNG/MP4/PDF instead.
- Building the per-user variant of this workflow where each user picks from their own templates and the variation lands in their personal **My Stuff**? See [Generate and Edit a Variant (OAuth Web App)](./e2e-generate-edit-variant-oauth.md)—steps 2 through 6 are identical; only step 1 differs.
- Need per-document explicit sharing instead of a shared project? The Adobe Content Platform (ACPC) invitations service (`https://invitations.adobe.io/api/v4`) is the supported path for that pattern. It is out of scope for this guide.
