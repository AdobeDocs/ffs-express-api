---
title: Create Document Variations
description: Learn how to create a document variation with per-element mappings, per-page overrides, and multiple output formats in a single request.
keywords:
  - Adobe Express
  - Adobe Express API
  - Create variation
  - create-variation
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

Learn how to create a single document variation by mapping tagged elements, optionally overriding specific pages, and returning one or more output formats in a single request.

<InlineAlert variant="warning" slots="heading, text" />

#### Beta API

The Create Variation API is currently in beta and may change before its production release.

## Overview

The Create Variation API (`POST /beta/create-variation`) takes a tagged Express template, replaces its tagged elements with your values, and produces one or more outputs. The process is asynchronous:

1. Submit the template ID, your element mappings, and the outputs you want.
2. Receive a `jobId` and a `statusUrl` (HTTP 202).
3. Poll `GET /status/{jobId}` until the job reaches `succeeded`.
4. Read the results from the `outputs` array in the status response.

<InlineAlert variant="info" slots="heading, text" />

#### Rate limit

The beta Create Variation API is rate-limited to **5 requests per minute (rpm)** by default. Exceeding the limit returns HTTP `429 Too Many Requests`. Higher throughput tiers are available on request; contact Adobe if your integration needs more.

## Create Variation vs. Generate Variation

Create Variation will supersede Generate Variation and Export Rendition. While both APIs process tagged templates asynchronously, Create Variation offers greater expressiveness. Use this table to compare their capabilities and prepare for the transition.

|                    | [Generate Variation](./generate-variations.md) | Create Variation                                                                                        |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Endpoint           | `POST /beta/generate-variation`                | `POST /beta/create-variation`                                                                           |
| Template reference | `id` (tagged document URN)                     | `templateOrDocument.creativeCloudFileId`                                                                |
| Element mappings   | Flat `tagMappings` (name → string or URL)      | Typed arrays: `textMappings`, `imageMappings`, `videoMappings`                                          |
| Per-page control   | None                                           | `pageOverrides` (different values per page)                                                             |
| Output             | One Express document (stored 30 days)          | `outputs[]`—any of `image`, `document`, `pdf`, `video`, each with its own page range and format options |

In short, **Create Variation** folds document creation _and_ rendition export into one call—request an image, a PDF, a video, and a persisted document from the same variation, and target specific pages for each.

## Prerequisites

- An Adobe Developer Console project with the **Adobe Express API** added, and a valid access token plus API key. See [Create credentials](../../getting-started/create-credentials/index.md).
- At least one tagged Express document you own. Tag elements with the [Tag Elements add-on](https://adobesparkpost.app.link/TR9Mb7TXFLb?mode=private&claimCode=wjmj67nj9:PLYN7XLJ).
- For image and video mappings, pre-signed URLs on an allowed domain (AWS S3, Azure Blob Storage, or Dropbox).

## Get your document ID

Create Variation references its template by `creativeCloudFileId`. Follow the [Get Tagged Documents guide](./get-tagged-documents.md) to list the tagged documents you own; each entry's `id` (a document URN) is the value you pass as `creativeCloudFileId`.

To discover the tag names and types a template exposes, call `GET /beta/tagged-documents/{id}`—the response lists each page's `taggedElements` with a `name` and a `type` (`text`, `image`, or `video`). Those `name` values are the `tagName`s you map in the next step.

## Create a variation

Make a `POST` request to `/beta/create-variation` with three things: `templateOrDocument` (the template `creativeCloudFileId`), `input` (your `mappings`), and `outputs` (the formats you want back). A minimal request replaces one text and one image element and asks for a single JPEG rendition of page 1.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```sh
curl -i -X POST \
  --url 'https://express-api.adobe.io/beta/create-variation' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \
  -H 'X-API-KEY: YOUR_API_KEY_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateOrDocument": {
      "creativeCloudFileId": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
    },
    "input": {
      "mappings": {
        "textMappings": [
          { "tagName": "headline", "text": "Summer Sale" }
        ],
        "imageMappings": [
          { "tagName": "heroImage", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg" } }
        ]
      },
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

```js
"outputs": [
  { "type": "document", "preferredDocumentName": "Summer Sale" }
]
```

You can also request several formats from the same variation in one call — mix as many output entries as you need:

```js
"outputs": [
  { "type": "image", "mediaType": "image/png", "size": 2048 },
  { "type": "pdf", "pdfType": "standard", "pages": "1-3" },
  { "type": "video", "mediaType": "video/mp4", "pages": "1" }
]
```

Each requested output comes back as its own entry in the status response's `outputs` array. See [Choose output formats](#choose-output-formats) for every type and its options.

## Poll the job

Call `GET /status/{jobId}` with the `jobId` from the previous step. The job returns `running` until it finishes, then `succeeded` (or `partially_succeeded` / `failed`). When it succeeds, the `outputs` array holds one result per requested output.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```sh
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

`input.mappings` groups replacements by element type. Every entry's `tagName` must match a tag `name` from the tagged-document details.

- `textMappings`: `{ "tagName": "...", "text": "..." }`
- `imageMappings`: `{ "tagName": "...", "source": { "url": "<pre-signed URL>" } }`
- `videoMappings`: `{ "tagName": "...", "source": { "url": "<pre-signed URL>" } }`

```js
"mappings": {
  "textMappings": [
    { "tagName": "headline", "text": "Summer Sale" },
    { "tagName": "subtitle", "text": "Up to 50% off" }
  ],
  "imageMappings": [
    { "tagName": "heroImage", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg" } }
  ],
  "videoMappings": [
    { "tagName": "promoVideo", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/promo.mp4" } }
  ]
}
```

Image and video URLs must be pre-signed and served from an allowed domain (AWS S3, Azure Blob Storage, or Dropbox).

<InlineAlert variant="warning" slots="text" />

**Known issue:** Video substitution may not always produce the expected results. We’re working to improve the experience.

## Override specific pages

By default, a mapping applies everywhere its tag appears. To give a tag a different value on a specific page—for example, a shorter headline on a page with a tighter layout—add a `pageOverrides` entry. A page override's mappings win over the top-level `input.mappings` for that page.

```js
"input": {
  "mappings": {
    "textMappings": [ { "tagName": "headline", "text": "Global Headline" } ]
  },
  "pageOverrides": [
    {
      "pageNumber": 2,
      "mappings": {
        "textMappings": [ { "tagName": "headline", "text": "Page 2 Headline" } ],
        "imageMappings": [ { "tagName": "heroImage", "source": { "url": "https://my-bucket.s3.us-east-2.amazonaws.com/page2.jpg" } } ]
      }
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

`pdfType` is `standard` (default) or `print`. Set `downloadIndividualPdfFiles` to `true` to get one PDF per page instead of a single combined file. The `config` object carries print settings (`bleed`, `cropMargins`) for `print`, or `accessibilityTags` for `standard`.

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

```js
const BASE = "https://express-api.adobe.io";

async function createVariation(body) {
  const resp = await fetch(`${BASE}/beta/create-variation`, {
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
    if (["succeeded", "partially_succeeded", "failed"].includes(data.status))
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
    mappings: {
      textMappings: [{ tagName: "headline", text: "Summer Sale" }],
      imageMappings: [
        {
          tagName: "heroImage",
          source: {
            url: "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg",
          },
        },
      ],
    },
    variationRequestId: "variation-001",
  },
  outputs: [{ type: "image", mediaType: "image/jpeg", size: 1024, pages: "1" }],
};

const { jobId, statusUrl } = await createVariation(body);
console.log("Job started:", jobId);

const result = await pollJob(statusUrl);
if (result.status === "failed") {
  console.error("Job failed:", result.errors);
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

`document` outputs are stored in your Adobe Express account and remain available for **30 days**, after which they are automatically removed. Find them in Adobe Express:

1. Go to **Your Stuff**.
2. Select **Express API Documents**.
3. View or modify your API-generated documents within the 30-day window.

Rendition outputs (`image`, `pdf`, `video`) are returned as pre-signed `destination.url`s in the status response—download them before the URLs expire.

For the full request and response surface, see the [API Reference](../../api/index.md).
