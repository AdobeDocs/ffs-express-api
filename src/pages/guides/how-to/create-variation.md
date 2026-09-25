---
title: Create Document Variations
description: Create single, bulk, and batch document variations on the Express API V1 endpoint by mapping tagged data fields, overriding specific pages, and returning multiple output formats.
keywords:
  - Adobe Express
  - Adobe Express API
  - Create variation
  - create-variation
  - V1 API
  - dataFieldMappings
  - Bulk create variation
  - bulk-create-variation
  - Batch create variation
  - batch-create-variation
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

Learn how to create document variations—one at a time, or in bulk and batches—by mapping tagged data fields, optionally overriding specific pages, and returning one or more output formats in a single request.

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

## Create Variation vs Bulk vs Batch

Create Variation generates one variation per request—ideal for interactive, user-facing flows. For backend, non-interactive, higher-volume generation, reach for **Bulk** or **Batch** Create Variation, covered in [Generate variations at scale](#generate-variations-at-scale-bulk-and-batch) below. Use this table to choose:

|                       | Create Variation                                                | Bulk Create Variation                                                                   | Batch Create Variation                                              |
| --------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Best for**          | Interactive, low-volume, user-facing generation (forms, UI flows) | High-scale backend workloads (thousands of documents, scheduled/enterprise jobs)        | Bounded backend jobs that don't need a file upload (a "mini bulk") |
| **Endpoint**          | `POST /v1/create-variation`                                     | `POST /v1/bulk-create-variation`                                                        | `POST /v1/batch-create-variation`                                  |
| **Input source**      | One set of mappings inline in the request                       | An external manifest JSON → NDJSON chunk file(s), one variation per row                  | An inline array of variations in the request body—no upload        |
| **Cap**               | 1 variation per request                                         | • 20,000 rows per NDJSON file\<br/>• 32 pending jobs per API key                         | • 30 variations per request (default)\<br/>• 1 MB request body     |
| **Output retrieval**  | Inline in the status response (`outputs[]`)                     | A downloadable output manifest → per-chunk NDJSON → per-row results                      | Inline in the status response (`results[]`), ordered per submission |
| **Output types**      | image, document, pdf, video                                     | image, document, pdf, video                                                             | image, document only                                               |
| **Cancellable**       | No                                                              | Yes (`POST /cancel/{jobId}`)                                                             | Yes (`POST /cancel/{jobId}`)                                        |
| **Interaction model** | Single job, typically short                                     | Asynchronous, non-interactive                                                            | Asynchronous, non-interactive, lighter-weight than Bulk            |

Generate Variation is deprecated in favor of Create Variation and has no V1 endpoint; see [Migrate from Beta to V1](../migration-beta-to-v1.md) to move an existing integration.

## Prerequisites

- An Adobe Developer Console project with the **Adobe Express API** added, and a valid access token plus API key. See [Create credentials](../../getting-started/create-credentials/index.md).
- At least one tagged Express document you own. Tag elements with the [Tag Elements add-on](https://adobesparkpost.app.link/TR9Mb7TXFLb?mode=private&claimCode=wjmj67nj9:PLYN7XLJ).
- For image and video mappings, pre-signed URLs on an allowed domain (AWS S3, Azure Blob Storage, or Dropbox).

## Get your document ID

Create Variation references its template by `creativeCloudFileId`. Follow the [Get Tagged Documents guide](./get-tagged-documents.md) to list the tagged documents you own; each entry's `id` (a document URN) is the value you pass as `creativeCloudFileId`.

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

Each requested output comes back as its own entry in the status response's `outputs` array. See [Choose output formats](#choose-output-formats) for every type and its options.

## Poll the job

Call `GET /status/{jobId}` with the `jobId` from the previous step. The job returns `running` until it finishes, then `succeeded` (or `partially_succeeded` / `failed`). When it succeeds, the `outputs` array holds one result per requested output.

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

Image and video URLs must be pre-signed and served from an allowed domain (AWS S3, Azure Blob Storage, or Dropbox).

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

## Generate variations at scale: Bulk and Batch

For backend, non-interactive workloads that generate many variations from one template, V1 adds two new endpoints. Both are asynchronous—submit the job, then poll `GET /status/{jobId}` exactly as you do for a single variation—and both can be cancelled while they run with `POST /cancel/{jobId}`. See the [API Reference](../../api/index.md) for the exhaustive request and response surface.

### Bulk Create Variation

`POST /v1/bulk-create-variation` reads its variations from an external data source: a manifest JSON that points at one or more NDJSON chunk files, where each line is one variation carrying its own `dataFieldMappings` (plus optional `pageOverrides` and `variationRequestId`). Use it for high-scale, unbounded workloads—up to 20,000 rows per NDJSON file, with up to 32 pending jobs per API key. The manifest and chunk files must be served from AWS S3, CloudFront, or Google Cloud Storage; the per-row image and video URLs follow the same allowlist as single Create Variation. Outputs can be image, document, pdf, or video.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X POST \
  --url 'https://express-api.adobe.io/v1/bulk-create-variation' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \
  -H 'X-API-KEY: YOUR_API_KEY_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateOrDocument": {
      "creativeCloudFileId": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
    },
    "input": {
      "source": { "url": "https://my-bucket.s3.amazonaws.com/manifest.json" },
      "mediaType": "application/json"
    },
    "outputs": [
      { "type": "image", "mediaType": "image/jpeg", "size": 1024 }
    ]
  }'
```

#### Response

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "statusUrl": "https://express-api.adobe.io/status/af121560-218e-4dd9-918d-add12b3b6d98",
  "cancelUrl": "https://express-api.adobe.io/cancel/af121560-218e-4dd9-918d-add12b3b6d98"
}
```

The manifest lists each chunk file and its row count. `totalRecords` must equal the sum of every chunk's `chunkRecords`, and no chunk may exceed the 20,000-row cap—otherwise the job is rejected before it starts:

```json
{
  "totalRecords": 500,
  "chunks": [
    { "source": { "url": "https://my-bucket.s3.amazonaws.com/chunk-1.ndjson" }, "mediaType": "application/x-ndjson", "chunkRecords": 500 }
  ]
}
```

Each line of a chunk file is one variation—the same input shape as a single Create Variation:

```json
{ "variationRequestId": "row-001", "dataFieldMappings": [ { "name": "headline", "type": "text", "text": "Fall Sale" }, { "name": "heroImage", "type": "image", "source": { "url": "https://my-bucket.s3.amazonaws.com/hero1.jpg" } } ] }
```

When the job succeeds, the status response's `outputs` array holds a downloadable **output manifest**. Download it to get the per-chunk NDJSON result files, whose lines carry each row's outputs and errors:

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "status": "succeeded",
  "summary": { "totalRecords": 500, "successfulRecords": 498, "failedRecords": 2 },
  "outputs": [
    { "mediaType": "application/json", "destination": { "url": "https://.../output-manifest.json" } }
  ]
}
```

### Batch Create Variation

`POST /v1/batch-create-variation` takes its variations inline in the request body—no upload. Send a `variations` array where each entry carries a **required, unique** `variationRequestId` plus its `dataFieldMappings` (and optional `pageOverrides`). Use it for bounded backend jobs of up to **30 variations** in a request body of at most **1 MB**. Batch outputs are **image and document only**. Results come back inline in the status response's `results[]`, ordered to match your submission—there is no file to download.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X POST \
  --url 'https://express-api.adobe.io/v1/batch-create-variation' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \
  -H 'X-API-KEY: YOUR_API_KEY_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateOrDocument": {
      "creativeCloudFileId": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
    },
    "variations": [
      {
        "variationRequestId": "row-001",
        "dataFieldMappings": [
          { "name": "headline", "type": "text", "text": "Summer Sale" }
        ]
      },
      {
        "variationRequestId": "row-002",
        "dataFieldMappings": [
          { "name": "headline", "type": "text", "text": "Winter Sale" }
        ]
      }
    ],
    "outputs": [
      { "type": "image", "mediaType": "image/jpeg", "size": 1024 }
    ]
  }'
```

#### Response

```json
{
  "jobId": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "statusUrl": "https://express-api.adobe.io/status/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "cancelUrl": "https://express-api.adobe.io/cancel/b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"
}
```

Poll `GET /status/{jobId}`; when it succeeds, each variation's outputs are inline under `results[]`, in submission order:

```json
{
  "jobId": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
  "status": "succeeded",
  "summary": { "totalRecords": 2, "successfulRecords": 2, "failedRecords": 0 },
  "results": [
    {
      "variationRequestId": "row-001",
      "status": "succeeded",
      "outputs": [ { "type": "image", "mediaType": "image/jpeg", "pageNumber": 1, "destination": { "url": "https://.../row-001.jpg" } } ]
    },
    {
      "variationRequestId": "row-002",
      "status": "succeeded",
      "outputs": [ { "type": "image", "mediaType": "image/jpeg", "pageNumber": 1, "destination": { "url": "https://.../row-002.jpg" } } ]
    }
  ]
}
```

## Find your generated documents

`document` outputs are stored in your Adobe Express account; find them in Adobe Express:

1. Go to **Your Stuff**.
2. Select **Express API Documents**.
3. View or modify your API-generated documents.

Rendition outputs (`image`, `pdf`, `video`) are returned as pre-signed `destination.url`s in the status response—download them before the URLs expire.

For the full request and response surface, see the [API Reference](../../api/index.md).
