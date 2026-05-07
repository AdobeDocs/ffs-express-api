---
title: Export Document Renditions
description: This guide shows you export document renditions.
keywords:
  - Adobe Express
  - Adobe Express API
  - Export document renditions
contributors:
  - https://github.com/hollyschinsky
hideBreadcrumbNav: true
---

# Export Document Renditions

Export your documents in your preferred format.

## Overview

The Export Rendition API converts your documents to supported formats, which currently includes JPG, PNG, MP4, and PDF. The API provides:

- Pre-signed URLs for each page's rendition
- Customizable image renditions up to a size of 8192px
- Video rendition support for pages with timelines up to a size of 4096px
- PDF rendition support for multi-page exports with standard or print settings
- Rendition URLs valid for 4 hours (images) and 24 hours (videos and PDFs)
- Status tracking through a dedicated URL

## Quick Start

### Step 1: Export a Rendition

Make a POST request to the `export-rendition` endpoint with these parameters:

- `id`: Document URN from the `generate-variation` endpoint
- `pages`: A comma-separated list or range of page numbers (1-based), for example `1,3-5` or `1-`
- `options.format`: `image/jpeg`, `image/png`, `video/mp4`, or `application/pdf`
- `options.size`: Rendition size for image/video exports (1px to 8192px for images and 146px to 4096px for videos)
- `options.pdfType` (PDF only): `standard` or `print`
- `options.downloadIndividualPdfFiles` (PDF only): `true` to download pages as separate PDFs, `false` for a single PDF
- `options.config` (PDF only): Optional settings for `accessibilityTags`, `bleed`, and `cropMargins`

## Part 1: Usage Example

In this step, you will see how to export a document rendition as an image in a chosen format using the `export-rendition` endpoint. We will use a `curl` command to make a `POST` request to the `export-rendition` endpoint.

### Step 1: Export Rendition Request

#### Request Parameters

Before making the request, ensure you have the following parameters:

- `id`: The document URN. Locate the document URN returned from the `generate-variation` endpoint and supply it in this parameter as the document to export.
- `pages`: A comma-separated list or range of page numbers (1-based), for example `1,2,3`, `1-3`, or `1-`.
- `options.format`: `image/jpeg`, `image/png`, `video/mp4`, or `application/pdf`.
- `options.size`: The size of the rendition on the longest side for images/videos. Aspect ratio is maintained. Minimum size supported is 1px to 8192px for images and 146px to 4096px for videos.
- `options.pdfType` (PDF only): `standard` or `print`.
- `options.downloadIndividualPdfFiles` (PDF only): `true` to download individual PDFs per page, `false` for a single PDF.
- `options.config` (PDF only): Optional configuration such as `accessibilityTags`, `bleed`, and `cropMargins`.

**Note:** The `options.size` parameter is optional. If not provided, the default size of the page is used. Replace `<USER_TOKEN>` & `<documentId>` with your values.

The response should contain a `jobId` and a `statusUrl` to check the status of the export job, ie:

A sample `curl` request and response is included below.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```sh
curl --request POST \
  --url 'https://express-api.adobe.io/beta/export-rendition' \
  -H 'Accept: */*' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \  
  -H 'X-Api-Key: YOUR_API_KEY_HERE' \
  --data '{
      "id": "<documentId>",
      "pages": "1-3",
      "options": {
          "format": "image/png",
          "size": 1024
      }
  }'
```

#### Response

```sh
{

    "jobId": "6db69b7c-e3fc-46ef-bdde-b5314d04f1fd",
    "statusUrl": "https://express-api.adobe.io/status/6db69b7c-e3fc-46ef-bdde-b5314d04f1fd"
}
```

### Step 2: Get Rendition Result

Now, use the [/status](../../api/index.md) endpoint to check the status of the export job, passing in the `jobId` returned in the response above as a path parameter. An example `curl` request and response is included below. In the response, the `renditionUrl` is the URL to the exported image.

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```sh
curl -i -X GET \
  --url 'https://express-api.adobe.io/status/6db69b7c-e3fc-46ef-bdde-b5314d04f1fd' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \  
  -H 'X-Api-Key: YOUR_API_KEY_HERE' \
```

#### Response

```sh
{
    "jobId": "6db69b7c-e3fc-46ef-bdde-b5314d04f1fd",
    "status": "succeeded",
    "id": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae",
    "pageRenditionsResult": [
    {
      "renditionUrl": "https://example.com/renditions/cf2398d7-50af-4c13-94e7-adf2ad6246ec.png",
      "pageNumber": 1
    }
  ]
}
```

## Part 2: Export Documents with Node.js

In this part of the guide, you will see how to create a script to export a document rendition with the supplied details using Node.js. The script uses the `fetch` API to make a `POST` request to the `export-rendition` endpoint.

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

Next, open the `index.mjs` and add the following code to export a document rendition with the supplied variation details. Replace the `id`, `pages` and `options` with your own values.

```js
let BASE = 'https://express-api.adobe.io';

async function exportRendition(id, pages, options) {

    let body = {
        id, 
        pages,
        options     
    }
    
    let resp = await fetch(`${BASE}/beta/export-rendition`, {
        method:'POST',
        headers: {
            'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
            'X-API-KEY': process.env.API_KEY,
            'Content-Type':'application/json'
        }, 
        body: JSON.stringify(body)
    });
    
    return await resp.json();
}

const id = "urn:aaid:sc:VA6C2:4e4cccff-055f-3b57-8196-607cc3a1e4f2";
const pages = "1-3";
const options = {        
    "format": "image/jpeg",
    "size": 1024
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

Next, update your `index.mjs` file with the following code, which polls for the job status using the `jobUrl` returned in the response with the [`/status`](../../api/index.md) endpoint. Once the job has succeeded, the exported rendition image will be opened in the browser.

```js
// If the status URL is present, poll the job until it is complete
if (result.statusUrl) {
    let jobResult = await pollJob(result.statusUrl, process.env.API_KEY, process.env.AUTH_TOKEN);
    console.log(jobResult);
    if (jobResult.status === 'succeeded') {
        console.log(`Rendition URL: ${jobResult.pageRenditionsResult[0].renditionUrl}`);
        open(jobResult.pageRenditionsResult[0].renditionUrl);
    } else {
        console.log(`Job failed with status: ${jobResult.status}`);
    }
}

async function delay(x) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, x);
    });
}

async function pollJob(jobUrl, id, token) {
    let status = '';

    while(status !== 'succeeded' && status !== 'failed') {

        let resp = await fetch(jobUrl, {
            headers: {
                'Authorization':`Bearer ${token}`,
                'x-api-key': id
            }
        });

        let data = await resp.json();
        status = data.status;

        // delay is a utility to 'pause' for X ms
        if (status !== 'succeeded' && status !== 'failed') await delay(1000);
        if (status === 'succeeded') return data;
    }

    return status;
}
```

## Complete Code Sample

Below is the complete script for exporting document renditions in Node.js:

```js
import open from 'open';

let BASE = 'https://express-api.adobe.io';

async function exportRendition(id, pages, options) {

    let body = {
        id, 
        pages,
        options     
    }
    
    let resp = await fetch(`${BASE}/beta/export-rendition`, {
        method:'POST',
        headers: {
            'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
            'X-API-KEY': process.env.API_KEY,
            'Content-Type':'application/json'
        }, 
        body: JSON.stringify(body)
    });
    
    return await resp.json();
}

const id = "urn:aaid:sc:VA6C2:4e4cccff-055f-3b57-8196-607cc3a1e4f2";
const pages = "1-3";
const options = {
    "format": "image/jpeg",
    "size": 1024
};

let result = await exportRendition(id, pages, options);
console.log(result);

if (result.statusUrl) {
    let jobResult = await pollJob(result.statusUrl, process.env.API_KEY, process.env.AUTH_TOKEN);
    console.log(jobResult);
    if (jobResult.status === 'succeeded') {
        console.log(`Rendition URL: ${jobResult.pageRenditionsResult[0].renditionUrl}`);
        open(jobResult.pageRenditionsResult[0].renditionUrl);
    } else {
        console.log(`Job failed with status: ${jobResult.status}`);
    }
}

async function delay(x) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, x);
    });
}

async function pollJob(jobUrl, id, token) {
    let status = '';

    while(status !== 'succeeded' && status !== 'failed') {

        let resp = await fetch(jobUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
                'x-api-key': process.env.API_KEY,
            }
        });

        let data = await resp.json();
        status = data.status;

        // delay is a utility to 'pause' for X ms
        if (status !== 'succeeded' && status !== 'failed') await delay(1000);
        if (status === 'succeeded') return data;
    }

    return status;
}
```

For more details, check out the [API Reference](../../api/index.md).
