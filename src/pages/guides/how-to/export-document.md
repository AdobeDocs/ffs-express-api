---
title: Export Document Renditions
description: This guide shows you how to export document renditions with the Express API V1 endpoint.
keywords:
  - Adobe Express
  - Adobe Express API
  - Export document renditions
contributors:
  - https://github.com/hollyschinsky
  - https://github.com/undavide
hideBreadcrumbNav: true
---

# Export Document Renditions

Export your documents in your preferred format.

## Overview

The Export Rendition API (`POST /v1/export-rendition`) converts your documents to supported formats, which currently includes JPG, PNG, MP4, and PDF. The API provides:

- Pre-signed URLs for each page's rendition
- Customizable image renditions up to a size of 8192px
- Video rendition support for pages with timelines up to a size of 4096px
- PDF rendition support for multi-page exports with standard or print settings
- Rendition URLs valid for 4 hours (images) and 24 hours (videos and PDFs)
- Status tracking through a dedicated URL

<InlineAlert variant="warning" slots="text" />

Public templates (Adobe-owned documents that haven't been copied to your account) can't be exported and return `400` (`client_error`). Documents that contain Adobe Stock-licensed assets also can't be exported and return `422` (`stock_content_detected`).

## Quick Start

### Step 1: Export a Rendition

Make a POST request to the `/v1/export-rendition` endpoint with these parameters:

- `templateOrDocument.creativeCloudFileId`: The document URN, for example from the [Get Tagged Documents](get-tagged-documents.md) response, or from the `documentId.creativeCloudFileId` of a [Create Variation](create-variation.md) `document` output.
- `pages`: A comma-separated list or range of page numbers (1-based), for example `1,3-5` or `1-`. If omitted, the first page is exported.
- `options.type`: `image`, `video`, or `pdf`.
- `options.mediaType` (image and video only): `image/jpeg`, `image/png`, or `video/mp4`. PDF options have no `mediaType`.
- `options.size` (image and video only): Rendition size on the longest side (1px to 8192px for images and 146px to 4096px for videos).
- `options.pages` (optional): Page selection inside `options`, using the same syntax as `pages`. If you set both, `options.pages` takes precedence.
- `options.pdfType` (PDF only): `standard` or `print`.
- `options.downloadIndividualPdfFiles` (PDF only): `true` to download pages as separate PDFs, `false` for a single PDF.
- `options.config` (PDF only): Optional settings, such as `accessibilityTags` for `standard` PDFs, or `bleed` and `cropMargins` for `print` PDFs.

## Part 1: Usage Example

In this step, you will see how to export a document rendition as an image in a chosen format using the `/v1/export-rendition` endpoint. We will use a `curl` command to make a `POST` request.

### Step 1: Export Rendition Request

#### Request Parameters

Before making the request, ensure you have the following parameters:

- `templateOrDocument.creativeCloudFileId`: The URN of the document to export.
- `pages`: A comma-separated list or range of page numbers (1-based), for example `1,2,3`, `1-3`, or `1-`.
- `options`: The output to produce, with `type` (`image`, `video`, or `pdf`) and, for images and videos, `mediaType` and an optional `size`. The aspect ratio is maintained. If `size` is not provided, the default size of the page is used.

Replace `YOUR_AUTH_TOKEN_HERE`, `YOUR_API_KEY_HERE`, and `<documentId>` with your values.

The response contains a `jobId` and a `statusUrl` to check the status of the export job. A sample `curl` request and response is included below.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```sh
curl --request POST \
  --url 'https://express-api.adobe.io/v1/export-rendition' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \
  -H 'X-API-KEY: YOUR_API_KEY_HERE' \
  -H 'Content-Type: application/json' \
  --data '{
      "templateOrDocument": {
          "creativeCloudFileId": "<documentId>"
      },
      "pages": "1-3",
      "options": {
          "type": "image",
          "mediaType": "image/png",
          "size": 1024
      }
  }'
```

#### Response

```json
{
  "jobId": "6db69b7c-e3fc-46ef-bdde-b5314d04f1fd",
  "statusUrl": "https://express-api.adobe.io/status/6db69b7c-e3fc-46ef-bdde-b5314d04f1fd"
}
```

#### Other output types

To export a video or a PDF instead, change the `options` object:

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Video

```json
{
  "options": {
    "type": "video",
    "mediaType": "video/mp4",
    "size": 1080
  }
}
```

#### PDF

```json
{
  "options": {
    "type": "pdf",
    "pdfType": "print",
    "downloadIndividualPdfFiles": false,
    "config": {
      "bleed": true,
      "bleedSettings": { "amount": 0.125, "unit": "in" },
      "cropMargins": true,
      "cropMarginsSettings": { "amount": 0.125, "unit": "in" }
    }
  }
}
```

### Step 2: Get Rendition Result

Now, use the [/status](../../api/index.md) endpoint to check the status of the export job, passing in the `jobId` returned in the response above as a path parameter. The job reports `pending` or `running` until it finishes, then `succeeded`, `partially_succeeded`, `failed`, or `cancelled`. An example `curl` request and response is included below.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```sh
curl -i -X GET \
  --url 'https://express-api.adobe.io/status/6db69b7c-e3fc-46ef-bdde-b5314d04f1fd' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \
  -H 'X-API-KEY: YOUR_API_KEY_HERE'
```

#### Response

```json
{
  "jobId": "6db69b7c-e3fc-46ef-bdde-b5314d04f1fd",
  "status": "succeeded",
  "templateOrDocument": {
    "creativeCloudFileId": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
  },
  "pageRenditionsResult": [
    {
      "pageNumber": 1,
      "renditionUrl": "https://example.com/renditions/page-1.png"
    },
    {
      "pageNumber": 2,
      "renditionUrl": "https://example.com/renditions/page-2.png"
    },
    {
      "pageNumber": 3,
      "renditionUrl": "https://example.com/renditions/page-3.png"
    }
  ]
}
```

Each `pageRenditionsResult` entry carries the `pageNumber` and either a `renditionUrl` to download the exported page or, if that page failed, an `error` object with an `error_code` and `message`. When some pages succeed and others fail, the job `status` is `partially_succeeded`. PDF exports return entries with a `renditionUrl` (or an `error`) and no `pageNumber`.

## Part 2: Export Documents with Node.js

In this part of the guide, you will see how to create a script to export a document rendition with the supplied details using Node.js. The script uses the `fetch` API to make a `POST` request to the `/v1/export-rendition` endpoint.

### Step 1: Set Up Your Environment

First, run the following commands in a secure terminal, replacing the key and token with your values. **Note:** The `open` dependency you will install is a node library that allows you to open the exported rendition URL in a browser.

```bash
export API_KEY=yourApiKeyHere
export AUTH_TOKEN=yourTokenHere

mkdir export-rendition-tutorial
cd export-rendition-tutorial
npm install open
touch index.mjs
```

### Step 2: Create the Export Rendition Script

Next, open the `index.mjs` and add the following code to export a document rendition. Replace the `id`, `pages` and `options` with your own values.

```js
let BASE = "https://express-api.adobe.io";

async function exportRendition(id, pages, options) {
  let body = {
    templateOrDocument: { creativeCloudFileId: id },
    pages,
    options,
  };

  let resp = await fetch(`${BASE}/v1/export-rendition`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      "X-API-KEY": process.env.API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return await resp.json();
}

const id = "urn:aaid:sc:VA6C2:4e4cccff-055f-3b57-8196-607cc3a1e4f2";
const pages = "1-3";
const options = {
  type: "image",
  mediaType: "image/jpeg",
  size: 1024,
};

let result = await exportRendition(id, pages, options);
console.log(result);
```

### Step 3: Run the Script

Run the script using the command: `node index.mjs` from the command line. If successful, you should see the `jobId` and `statusUrl` in the response, like shown here:

```sh
{
    "jobId":"6b85350d-4dc8-4cd5-8eb8-d6de4bf3fd4b",
    "statusUrl":"https://express-api.adobe.io/status/6b85350d-4dc8-4cd5-8eb8-d6de4bf3fd4b"
}
```

Next, update your `index.mjs` file with the following code, which polls the `statusUrl` returned in the response with the [`/status`](../../api/index.md) endpoint. Once the job has finished, the first successful rendition is opened in the browser.

```js
// If the status URL is present, poll the job until it is complete
if (result.statusUrl) {
  let jobResult = await pollJob(result.statusUrl);
  console.log(jobResult);
  const rendition = jobResult.pageRenditionsResult?.find(
    (item) => item.renditionUrl,
  );
  if (
    ["succeeded", "partially_succeeded"].includes(jobResult.status) &&
    rendition
  ) {
    console.log(`Rendition URL: ${rendition.renditionUrl}`);
    open(rendition.renditionUrl);
  } else {
    console.log(`Job finished with status: ${jobResult.status}`);
  }
}

async function delay(x) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, x);
  });
}

async function pollJob(jobUrl) {
  const terminal = ["succeeded", "partially_succeeded", "failed", "cancelled"];

  while (true) {
    let resp = await fetch(jobUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        "X-API-KEY": process.env.API_KEY,
      },
    });

    let data = await resp.json();
    if (terminal.includes(data.status)) return data;

    // delay is a utility to 'pause' for X ms
    await delay(1000);
  }
}
```

## Complete Code Sample

Below is the complete script for exporting document renditions in Node.js:

```js
import open from "open";

let BASE = "https://express-api.adobe.io";

async function exportRendition(id, pages, options) {
  let body = {
    templateOrDocument: { creativeCloudFileId: id },
    pages,
    options,
  };

  let resp = await fetch(`${BASE}/v1/export-rendition`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      "X-API-KEY": process.env.API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return await resp.json();
}

const id = "urn:aaid:sc:VA6C2:4e4cccff-055f-3b57-8196-607cc3a1e4f2";
const pages = "1-3";
const options = {
  type: "image",
  mediaType: "image/jpeg",
  size: 1024,
};

let result = await exportRendition(id, pages, options);
console.log(result);

if (result.statusUrl) {
  let jobResult = await pollJob(result.statusUrl);
  console.log(jobResult);
  const rendition = jobResult.pageRenditionsResult?.find(
    (item) => item.renditionUrl,
  );
  if (
    ["succeeded", "partially_succeeded"].includes(jobResult.status) &&
    rendition
  ) {
    console.log(`Rendition URL: ${rendition.renditionUrl}`);
    open(rendition.renditionUrl);
  } else {
    console.log(`Job finished with status: ${jobResult.status}`);
  }
}

async function delay(x) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, x);
  });
}

async function pollJob(jobUrl) {
  const terminal = ["succeeded", "partially_succeeded", "failed", "cancelled"];

  while (true) {
    let resp = await fetch(jobUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        "X-API-KEY": process.env.API_KEY,
      },
    });

    let data = await resp.json();
    if (terminal.includes(data.status)) return data;

    // delay is a utility to 'pause' for X ms
    await delay(1000);
  }
}
```

For more details, check out the [API Reference](../../api/index.md).
