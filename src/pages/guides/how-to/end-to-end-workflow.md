---
title: Create an End-to-End Express API Workflow
description: Build a workflow combining Express API endpoints to fetch tagged documents, create variations, and export renditions.
keywords:
  - Adobe Express
  - Adobe Express API
  - Export document renditions
  - Document variations
  - Tagged documents
  - Content automation
  - Node.js workflow
contributors:
  - https://github.com/hollyschinsky
hideBreadcrumbNav: true
---

# Create an End-to-End Express API Workflow

This guide provides an end-to-end workflow example for interacting with the Express API endpoints.

## Overview

This guide demonstrates how to create a comprehensive workflow using multiple Adobe Express API endpoints. You'll learn how to:

- Build a Node.js script that chains together multiple API operations
- Handle asynchronous API responses and job polling
- Process and manipulate Adobe Express documents programmatically

The workflow script showcases three key Express API capabilities:

1. **Document Discovery**: Fetch and list tagged documents from your Adobe Express library
2. **Content Variation**: Create a new variation of a document by substituting tagged content
3. **Export Management**: Generate renditions of documents in your preferred format (JPG, PNG, MP4, or PDF)

This example serves as a foundation for building more sophisticated workflows, whether you're creating a content automation pipeline or integrating Adobe Express capabilities into your applications.

The example script provided performs the following tasks:

1. Fetches tagged documents and prints the details to the console.
2. Exports a rendition of the original document ID specified.
3. Generates a variation of the original document with the substituted tags.
4. Exports a rendition of the generated variation, based on the new document ID returned in the result.

## Prerequisites

- Node.js 18+ installed on your machine (the script uses built-in `fetch`).
- Environment variables `AUTH_TOKEN` and `API_KEY` set with appropriate values.

## Steps

### Step 1: Set Up Your Environment

Ensure you have the following environment variables set in your terminal or in a `.env` file:

```sh
export AUTH_TOKEN=your_auth_token
export API_KEY=your_api_key
```

### Step 2: Install Dependencies

Install the required `open` dependency, which is a node library that allows you to open a URL in a browser (ie: to view the exported rendition and generated variation):

```sh
npm install open
```

### Step 2: Create the End-to-End Script

Create a file named `e2e-workflow.mjs` and add the following script, replacing `documentId`, `pages`, `options`, and `variationInput` with your own values. Replace the image and video URLs with full pre-signed URLs for your assets. The script uses [Create Variation](./create-variation.md) with a `document` output so the result is persisted before it is exported.

```js
import open from "open";

let BASE = "https://express-api.adobe.io";
const headers = {
  Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
  "X-API-KEY": process.env.API_KEY,
};

const documentId = "urn:aaid:sc:VA6C2:d8638bc5-33d0-3aaf-9e08-9932a8fccf0f"; // replace with your document ID
const pages = "1";
const options = {
  type: "image",
  mediaType: "image/jpeg", // or "image/png"
  size: 1024,
};

// Use data-field names and types from your tagged document
const variationInput = {
  dataFieldMappings: [
    { name: "brandTag", type: "text", text: "My Brand" },
    {
      name: "brandLogo", type: "image",
      source: { url: "https://my-bucket.s3.us-east-2.amazonaws.com/logo.jpg" },
    },
    {
      name: "actionVideo", type: "video",
      source: { url: "https://my-bucket.s3.us-east-2.amazonaws.com/action.mp4" },
    },
  ],
};

// Fetch tagged documents
async function getTaggedDocuments() {
  try {
    const url = `${BASE}/v1/tagged-documents?start=0&limit=10&sortBy=modifiedDate`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Process the documents
    const documents = data.documents || [];
    documents.forEach((doc) => {
      console.log(
        `\tTagged Doc ID: ${doc.templateOrDocument.creativeCloudFileId}, Name: ${doc.name}, Thumbnail URL: ${doc.thumbnailUrl}`,
      );
    });
  } catch (error) {
    console.error(`Failed to fetch documents: ${error}`);
  }
}

// Export rendition
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

  if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
  return await resp.json();
}

// Create a persisted document variation
async function createVariation(id, input) {
  let body = {
    templateOrDocument: { creativeCloudFileId: id },
    input,
    outputs: [{ type: "document", preferredDocumentName: "New document variation" }],
  };

  let resp = await fetch(`${BASE}/v1/create-variation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      "X-API-KEY": process.env.API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
  return await resp.json();
}

// Call each API and wait for each job before continuing
console.log("\n\n\n**** GET TAGGED DOCUMENTS ****\n");
await getTaggedDocuments();

console.log("\n\n\n**** EXPORTING RENDITION OF ORIGINAL DOCUMENT ****\n");
let result = await exportRendition(documentId, pages, options);
console.log(result);
await getJobResult(result, "export-rendition");

console.log("\n\n\n**** CREATING VARIATION ****\n");
result = await createVariation(documentId, variationInput);
console.log(result);
await getJobResult(result, "create-variation");

async function getJobResult(result, endpoint) {
  if (!result.statusUrl) throw new Error("No status URL was returned");
  const jobResult = await pollJob(result.statusUrl);
  console.log(jobResult);
  if (["failed", "cancelled"].includes(jobResult.status)) {
    console.error(jobResult.errors ?? jobResult.pageRenditionsResult);
    throw new Error(`${endpoint} job ${jobResult.status}`);
  }
  if (jobResult.status === "partially_succeeded") {
    console.warn("Some outputs failed:", jobResult.errors ?? jobResult.pageRenditionsResult);
  }
  if (endpoint === "create-variation") {
    const documentOutput = jobResult.outputs?.find(
      (output) => output.type === "document",
    );
    if (!documentOutput) throw new Error("No document output was returned");
    const variationDocumentId = documentOutput.documentId.creativeCloudFileId;
    console.log(`\t-> Created variation - new document ID: ${variationDocumentId}`);
    console.log("\n\n\n**** EXPORTING RENDITION OF VARIATION ****\n");
    const exportJob = await exportRendition(variationDocumentId, pages, options);
    console.log(exportJob);
    await getJobResult(exportJob, "export-rendition");
  }
  if (endpoint === "export-rendition") {
    const rendition = jobResult.pageRenditionsResult?.find((item) => item.renditionUrl);
    if (!rendition) throw new Error("No successful rendition was returned");
    console.log(`\t-> Opening Exported Rendition ${rendition.renditionUrl}`);
    await open(rendition.renditionUrl);
  }
  return jobResult;
}

async function delay(x) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, x);
  });
}

async function pollJob(jobUrl) {
  while (true) {
    let resp = await fetch(jobUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        "X-API-KEY": process.env.API_KEY,
      },
    });

    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    const data = await resp.json();
    if (["succeeded", "partially_succeeded", "failed", "cancelled"].includes(data.status)) return data;
    await delay(3000);
  }
}
```

### Step 3: Run the Script

Run the script in your terminal using the command: `node e2e-workflow.mjs`. If successful, you should see output like shown in the [Example Output](#example-output) section below.

```sh
node e2e-workflow.mjs
```

## Script Breakdown

- **Import Dependencies**

  ```js
  import open from "open";
  ```

- **Set Up Constants and Headers**

  ```js
  let BASE = "https://express-api.adobe.io";
  const headers = {
    Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
    "X-API-KEY": process.env.API_KEY,
  };
  ```

- **Fetch Tagged Documents**

  Fetch tagged documents and print the details to the console:

  ```js
  async function getTaggedDocuments() {
    try {
      const url = `${BASE}/v1/tagged-documents?start=0&limit=10&sortBy=modifiedDate`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Process the documents
      const documents = data.documents || [];
      documents.forEach((doc) => {
        console.log(
          `\tTagged Doc ID: ${doc.templateOrDocument.creativeCloudFileId}, Name: ${doc.name}, Thumbnail URL: ${doc.thumbnailUrl}`,
        );
      });
    } catch (error) {
      console.error(`Failed to fetch documents: ${error}`);
    }
  }
  ```

- **Generate a Variation**

  Call `POST /v1/create-variation` with the source document ID, `input.dataFieldMappings`, and a `document` output:

  ```js
  async function createVariation(id, input) {
    let body = {
      templateOrDocument: { creativeCloudFileId: id },
      input,
      outputs: [{ type: "document", preferredDocumentName: "New document variation" }],
    };

    let resp = await fetch(`${BASE}/v1/create-variation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        "X-API-KEY": process.env.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    return await resp.json();
  }
  ```

- **Export a Rendition**

  Export a rendition with `templateOrDocument`, `pages`, and `options`. V1 options use `type` and `mediaType`, not `format`; see [Migrate from Beta to V1](../migration-beta-to-v1.md#update-rendition-options).

  ```js
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

    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    return await resp.json();
  }
  ```

- **Polling Job Results**

Poll until the job returns `succeeded`, `partially_succeeded`, `failed`, or `cancelled`. Create Variation returns successful results in `outputs` and output failures in `errors`; each error has an `error_code` and optional `message`, `type`, and `pageNumber`. Read a document output's `documentId.creativeCloudFileId` to export the generated variation. Export Rendition returns `pageRenditionsResult` entries with either `renditionUrl` or `error`:

```js
async function getJobResult(result, endpoint) {
  if (!result.statusUrl) throw new Error("No status URL was returned");
  const jobResult = await pollJob(result.statusUrl);
  console.log(jobResult);
  if (["failed", "cancelled"].includes(jobResult.status)) {
    console.error(jobResult.errors ?? jobResult.pageRenditionsResult);
    throw new Error(`${endpoint} job ${jobResult.status}`);
  }
  if (jobResult.status === "partially_succeeded") {
    console.warn("Some outputs failed:", jobResult.errors ?? jobResult.pageRenditionsResult);
  }
  if (endpoint === "create-variation") {
    const documentOutput = jobResult.outputs?.find(
      (output) => output.type === "document",
    );
    if (!documentOutput) throw new Error("No document output was returned");
    const variationDocumentId = documentOutput.documentId.creativeCloudFileId;
    console.log(`\t-> Created variation - new document ID: ${variationDocumentId}`);
    console.log("\n\n\n**** EXPORTING RENDITION OF VARIATION ****\n");
    const exportJob = await exportRendition(variationDocumentId, pages, options);
    console.log(exportJob);
    await getJobResult(exportJob, "export-rendition");
  }
  if (endpoint === "export-rendition") {
    const rendition = jobResult.pageRenditionsResult?.find((item) => item.renditionUrl);
    if (!rendition) throw new Error("No successful rendition was returned");
    console.log(`\t-> Opening Exported Rendition ${rendition.renditionUrl}`);
    await open(rendition.renditionUrl);
  }
  return jobResult;
}
```

- **Utility Functions**

  The `create-variation` and `export-rendition` endpoints are asynchronous. Poll the returned `statusUrl` every three seconds until a terminal status is returned; unfinished jobs can report `pending` or `running`:

  ```js
  async function delay(x) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, x);
    });
  }

  async function pollJob(jobUrl) {
    while (true) {
      let resp = await fetch(jobUrl, {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
          "X-API-KEY": process.env.API_KEY,
        },
      });

      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const data = await resp.json();
      if (["succeeded", "partially_succeeded", "failed", "cancelled"].includes(data.status)) return data;
      await delay(3000);
    }
  }
  ```

- **API Calls**

  Call each API and await each job before continuing. This exports the original document, creates a persisted variation, and then exports that variation:

  ```js
  console.log("\n\n\n**** GET TAGGED DOCUMENTS ****\n");
  await getTaggedDocuments();

  console.log("\n\n\n**** EXPORTING RENDITION OF ORIGINAL DOCUMENT ****\n");
  let result = await exportRendition(documentId, pages, options);
  console.log(result);
  await getJobResult(result, "export-rendition");

  console.log("\n\n\n**** CREATING VARIATION ****\n");
  result = await createVariation(documentId, variationInput);
  console.log(result);
  await getJobResult(result, "create-variation");
  ```

## Example Output

The script logs each submitted job and its status response. The following excerpt shows a successful document variation followed by its rendition export; identifiers and URLs vary:

```sh
**** CREATING VARIATION ****
{
  jobId: '76b87e58-e3c0-4929-8fd1-4f6f390544bc',
  statusUrl: 'https://express-api.adobe.io/status/76b87e58-e3c0-4929-8fd1-4f6f390544bc'
}

{
  jobId: '76b87e58-e3c0-4929-8fd1-4f6f390544bc',
  status: 'succeeded',
  outputs: [
    {
      type: 'document',
      documentId: {
        creativeCloudFileId: 'urn:aaid:sc:VA6C2:5b563ed1-1396-31b4-8df2-6f61bda55e7e'
      },
      name: 'New document variation'
    }
  ]
}

-> Created variation - new document ID: urn:aaid:sc:VA6C2:5b563ed1-1396-31b4-8df2-6f61bda55e7e

**** EXPORTING RENDITION OF VARIATION ****
{
  jobId: '9736e049-e48b-4b08-8434-0e61f110de47',
  statusUrl: 'https://express-api.adobe.io/status/9736e049-e48b-4b08-8434-0e61f110de47'
}

{
  jobId: '9736e049-e48b-4b08-8434-0e61f110de47',
  status: 'succeeded',
  templateOrDocument: {
    creativeCloudFileId: 'urn:aaid:sc:VA6C2:5b563ed1-1396-31b4-8df2-6f61bda55e7e'
  },
  pageRenditionsResult: [
    {
      renditionUrl: 'https://example.com/renditions/rendition.jpg',
      pageNumber: 1
    }
  ]
}
-> Opening Exported Rendition https://example.com/renditions/rendition.jpg
```
