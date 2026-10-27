---
title: Create Document Variations
description: Create document variations on the Express API V1 endpoint by mapping tagged data fields, overriding specific pages, and returning multiple output formats.
keywords:
  - Adobe Express
  - Adobe Express API
  - Create variation
  - create-variation
  - V1 API
  - dataFieldMappings
  - Page overrides
  - Page ranges
  - Image output
  - PDF output
  - Video output
  - Tagged documents
contributors:
  - https://github.com/undavide
hideBreadcrumbNav: true
---

# Create Document Variations

Learn how to create document variations by mapping tagged data fields, optionally overriding specific pages, and returning one or more output formats in a single request.

<InlineAlert variant="info" slots="heading, text" />

#### V1 API

Create Variation is available on the V1 endpoint, the generally-available-track successor to the Beta API. V1 and Beta coexist during the transition—see [Migrate from Beta to V1](../migration-beta-to-v1.md) if you have an existing Beta integration.

The Create Variation API (`POST /v1/create-variation`) takes a tagged Express template, replaces its tagged data fields with your values, and produces one or more outputs. The process is asynchronous:

1. Submit the template ID, your data-field mappings, and the outputs you want.
2. Receive a `jobId` and a `statusUrl` (HTTP 202).
3. Poll `GET /status/{jobId}` until the job reaches `succeeded`.
4. Read the results from the `outputs` array in the status response.

<InlineAlert variant="info" slots="heading, text" />

#### Rate limits

The Express API is rate-limited. Exceeding the limit returns HTTP `429 Too Many Requests`. See [Rate limits](../../getting-started/rate-limits/index.md) for the current limits.

## Prerequisites

- An Adobe Developer Console project with the **Adobe Express API** added, and a valid access token plus API key. See [Create credentials](../../getting-started/create-credentials/index.md).
- At least one tagged Express document you own. Tag elements using **Data Fields**, as described [in this guide](./tag-documents.md).
- For image and video mappings, pre-signed HTTPS URLs from a supported cloud storage provider (AWS S3, Azure Blob Storage, or Dropbox).

## Get your document ID

Create Variation references its template by `creativeCloudFileId`. Follow the [Get Tagged Documents guide](./get-tagged-documents.md) to list the tagged documents you own; each V1 entry's `templateOrDocument.creativeCloudFileId` (a document URN) is the value you pass as `creativeCloudFileId`.

To discover the data-field names and types a template exposes, call `GET /v1/tagged-documents/{id}`—the response lists each page's `dataFields`, each with a `name` and a `type` (`text`, `image`, or `video`). Those `name` values are what you map in `dataFieldMappings` in the next step.

## Create a variation

Make a `POST` request to `/v1/create-variation` with three things: `templateOrDocument` (the template `creativeCloudFileId`), `input` (your `dataFieldMappings`), and `outputs` (the formats you want back). A minimal request replaces one text and one image data field and asks for a single JPEG rendition of page 1.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X POST \
  --url 'https://express-api.adobe.io/v1/create-variation' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \
  -H 'X-API-KEY: YOUR_API_KEY_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateOrDocument": {
      "creativeCloudFileId": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
    },
    "input": {
      "dataFieldMappings": [
        { "name": "headline", "type": "text", "text": "Summer Sale" },
        { "name": "heroImage", "type": "image", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg" } }
      ],
      "variationRequestId": "variation-001"
    },
    "outputs": [
      { "type": "image", "mediaType": "image/jpeg", "size": 1024, "pages": "1" }
    ]
  }'
```

#### Response

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "statusUrl": "https://express-api.adobe.io/status/af121560-218e-4dd9-918d-add12b3b6d98"
}
```

### Request a different output type

The `outputs` array controls what you get back. To produce something other than an image, change the entry's `type`. For example, persist a new Express document instead of a rendition:

```javascript
"outputs": [
  { "type": "document", "preferredDocumentName": "Summer Sale" }
]
```

You can also request several formats from the same variation in one call—mix as many output entries as you need:

```javascript
"outputs": [
  { "type": "image", "mediaType": "image/png", "size": 2048 },
  { "type": "pdf", "pdfType": "standard", "pages": "1-3" },
  { "type": "video", "mediaType": "video/mp4", "pages": "1" }
]
```

Results come back in the status response's `outputs` array: `image` and `video` outputs return one entry per rendered page, while `pdf` and `document` outputs return a single entry each. See [Choose output formats](#choose-output-formats) for every type and its options.

## Poll the job

Call `GET /status/{jobId}` with the `jobId` from the previous step. The job reports `pending` or `running` until it finishes, then `succeeded` (or `partially_succeeded`, `failed`, or `cancelled`). When it succeeds, the `outputs` array holds the results: one entry per rendered page for `image` and `video` outputs, and one entry per `pdf` or `document` output.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X GET \
  --url 'https://express-api.adobe.io/status/af121560-218e-4dd9-918d-add12b3b6d98' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \
  -H 'X-API-KEY: YOUR_API_KEY_HERE'
```

#### Response

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "status": "succeeded",
  "variationRequestId": "variation-001",
  "outputs": [
    {
      "type": "image",
      "mediaType": "image/jpeg",
      "pageNumber": 1,
      "destination": {
        "url": "https://exapi-assets-storage-prod-ue1.s3.us-east-1.amazonaws.com/results/..."
      }
    }
  ]
}
```

Each `image` result carries the `pageNumber` it was rendered from and a `destination.url` you can download. A `document` output returns the persisted Express document instead:

```json
{
  "jobId": "a5dc31af-8f13-4a5f-86d3-91210b751b89",
  "status": "succeeded",
  "outputs": [
    {
      "type": "image",
      "mediaType": "image/jpeg",
      "pageNumber": 1,
      "destination": {
        "url": "https://exapi-assets-storage-prod-ue1.s3.us-east-1.amazonaws.com/results/..."
      }
    },
    {
      "type": "pdf",
      "destination": {
        "url": "https://cpf-temp-repo-ue1-prod.s3.amazonaws.com/538b4856-..."
      }
    }
  ],
  "variationRequestId": "variation-001"
}
```

The `pdf` and `video` outputs follow the same shape—each appears as an entry in `outputs` with a downloadable `destination.url`. The optional `variationRequestId` is echoed back in the response, which is handy for correlating results when you fire several requests.

<InlineAlert variant="info" slots="text" />

When some outputs succeed and others do not, `status` is `partially_succeeded` and the response includes an `errors` array alongside `outputs`. Each error carries an `error_code`, a `message`, and—where applicable—the `type` and `pageNumber` it refers to.

## Replace text, images, and videos

`input.dataFieldMappings` is a flat array of replacements. Every entry's `name` must match a data-field `name` from the tagged-document details, and its `type` selects the value shape:

- `text`: `{ "name": "...", "type": "text", "text": "..." }`
- `image`: `{ "name": "...", "type": "image", "source": { "url": "<pre-signed URL>" } }`
- `video`: `{ "name": "...", "type": "video", "source": { "url": "<pre-signed URL>" } }`

```javascript
"dataFieldMappings": [
  { "name": "headline", "type": "text", "text": "Summer Sale" },
  { "name": "subtitle", "type": "text", "text": "Up to 50% off" },
  { "name": "heroImage", "type": "image", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg" } },
  { "name": "promoVideo", "type": "video", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/promo.mp4" } }
]
```

Image and video URLs must be pre-signed HTTPS URLs from a supported cloud storage provider (AWS S3, Azure Blob Storage, or Dropbox); other URLs are rejected.

<InlineAlert variant="warning" slots="text" />

**Known issue:** Video substitution may not always produce the expected results.

## Override specific pages

By default, a mapping applies everywhere its data field appears. To give a data field a different value on a specific page—for example, a shorter headline on a page with a tighter layout—add a `pageOverrides` entry. A page override's `dataFieldMappings` win over the top-level `input.dataFieldMappings` for that page.

```javascript
"input": {
  "dataFieldMappings": [ { "name": "headline", "type": "text", "text": "Global Headline" } ],
  "pageOverrides": [
    {
      "pageNumber": 2,
      "dataFieldMappings": [
        { "name": "headline", "type": "text", "text": "Page 2 Headline" },
        { "name": "heroImage", "type": "image", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/page2.jpg" } }
      ]
    }
  ]
}
```

Page numbers start at 1.

## Choose output formats

`outputs` is an array—request as many formats as you need from one variation. Each entry is discriminated by its `type`.

### Image

```json
{ "type": "image", "mediaType": "image/jpeg", "size": 1024, "pages": "1,2" }
```

`mediaType` is `image/jpeg` or `image/png`. `size` is the longest side in pixels (1–8192); the aspect ratio is preserved. Omit `pages` to render every page.

### Document

```json
{
  "type": "document",
  "preferredDocumentName": "Summer Sale",
  "destinationFolder": {
    "creativeCloudProjectId": "urn:aaid:sc:VA6C2:2e413892-0f74-43da-8516-3fc1b37922ad"
  }
}
```

A `document` output persists a new Express document. Supply a `preferredDocumentName` (a unique name is generated if it is missing or taken) and, optionally, a `destinationFolder`. Without a `destinationFolder`, the document is saved to your default storage.

### PDF

```json
{
  "type": "pdf",
  "pdfType": "print",
  "downloadIndividualPdfFiles": false,
  "config": {
    "bleed": true,
    "bleedSettings": { "amount": 0.125, "unit": "in" },
    "cropMargins": true,
    "cropMarginsSettings": { "amount": 0.125, "unit": "in" }
  },
  "pages": "1-3"
}
```

`pdfType` is `standard` (default) or `print`. Set `downloadIndividualPdfFiles` to `true` to get one PDF per page instead of a single combined file; the status response then returns a single `destination.url` pointing to a ZIP archive of the per-page PDFs. The `config` object carries print settings (`bleed`, `cropMargins`) for `print`, or `accessibilityTags` for `standard`.

<InlineAlert variant="warning" slots="text" />

**Known issue:** exporting a PDF from a document that contains video can currently fail. Remove or avoid video elements when a PDF output is required.

### Video

```json
{ "type": "video", "mediaType": "video/mp4", "size": 1080, "pages": "1" }
```

`mediaType` is `video/mp4`. `size` is the longest side in pixels (146–4096). Pages that do not support video export are reported as per-page errors in the status response.

## Target specific pages

The `pages` field on `image`, `pdf`, and `video` outputs limits which pages are rendered, using a comma-separated string of page numbers and ranges:

- `"1,2,3"`: pages 1, 2, and 3
- `"1-3"`: pages 1 through 3
- `"1,3-5"`: pages 1, 3, 4, and 5
- `"1-"`: page 1 to the last page
- `"5-"`: page 5 to the last page

Omit `pages` to include every page. Page numbers start at 1.

## Create a variation with Node.js

The script below submits a create-variation request, polls the job, and logs each output's download URL. It uses the built-in `fetch` API (Node.js 18+).

```javascript
const BASE = "https://express-api.adobe.io";

async function createVariation(body) {
  const resp = await fetch(`${BASE}/v1/create-variation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      "X-API-KEY": process.env.API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollJob(statusUrl) {
  while (true) {
    const resp = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        "X-API-KEY": process.env.API_KEY,
      },
    });
    const data = await resp.json();
    if (
      ["succeeded", "partially_succeeded", "failed", "cancelled"].includes(
        data.status,
      )
    )
      return data;
    await delay(3000);
  }
}

const body = {
  templateOrDocument: {
    creativeCloudFileId:
      "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae",
  },
  input: {
    dataFieldMappings: [
      { name: "headline", type: "text", text: "Summer Sale" },
      {
        name: "heroImage",
        type: "image",
        source: {
          url: "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg",
        },
      },
    ],
    variationRequestId: "variation-001",
  },
  outputs: [{ type: "image", mediaType: "image/jpeg", size: 1024, pages: "1" }],
};

const { jobId, statusUrl } = await createVariation(body);
console.log("Job started:", jobId);

const result = await pollJob(statusUrl);
if (result.status === "failed" || result.status === "cancelled") {
  console.error(`Job ${result.status}:`, result.errors);
} else {
  for (const output of result.outputs ?? []) {
    console.log(
      `${output.type} →`,
      output.destination?.url ?? output.documentId,
    );
  }
  if (result.status === "partially_succeeded")
    console.warn("Some outputs failed:", result.errors);
}
```

Set your credentials as environment variables before running it:

```bash
export API_KEY=yourApiKeyHere
export AUTH_TOKEN=yourTokenHere
node index.mjs
```

## Find your generated documents

`document` outputs are stored in your Adobe Express account; find them in Adobe Express:

1. Go to **Your Stuff**.
2. Select **Express API Documents**.
3. View or modify your API-generated documents.

Rendition outputs (`image`, `pdf`, `video`) are returned as pre-signed `destination.url`s in the status response—download them before the URLs expire.

For the full request and response surface, see the [API Reference](../../api/index.md).
