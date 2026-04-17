---
title: Create an End-to-End Express API Workflow
description: Build a Node.js workflow that combines Express API endpoints to fetch tagged documents, create variations, and export renditions while handling asynchronous operations.
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
2. Generates a variation of the original document with the substituted tags.
3. Exports a rendition of the generated variation, based on the new document ID returned in the result.

## Prerequisites

- Node.js installed on your machine.
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

Create a file named `e2e-workflow.mjs` and add the following script code below, replacing the `documentId`, `pages`, `options` and `variationDetails` with your own.

```js
import open from 'open';

let BASE = 'https://express-api.adobe.io';
const headers = {
    'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
    'X-API-KEY': process.env.API_KEY
};

const documentId = "urn:aaid:sc:VA6C2:d8638bc5-33d0-3aaf-9e08-9932a8fccf0f"; // replace with your document ID
const pages = "1";
const options = {
    "format": "image/jpeg", // or "image/png", "video/mp4", or "application/pdf"
    "size": 1024
    // For PDFs, include options like:
    // pdfType: "standard" | "print",
    // downloadIndividualPdfFiles: true | false,
    // config: { accessibilityTags: true, bleed: true, cropMargins: true, ... }
};

// Replace the variationDetails with your own values based on the tags in your document
const variationDetails = {
    "pages": "1",
    "preferredDocumentName": "New document variation",
    "tagMappings": {
        "brandTag": "My Brand",        
        "brandLogo": "https://my-bucket.s3.us-east-2.amazonaws.com/logo.jpg",
        "actionVideo": "https://my-bucket.s3.us-east-2.amazonaws.com/action.mp4"        
    }   
};

// Fetch tagged documents
async function getTaggedDocuments() {
    try {
        const url = `${BASE}/beta/tagged-documents?start=0&limit=10&sortBy=modifiedDate`;        
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Process the documents
        const documents = data.documents || [];
        documents.forEach(doc => {
          console.log(`\tTagged Doc ID: ${doc.id}, Name: ${doc.name}, Thumbnail URL: ${doc.thumbnailUrl}`);
        });
    } catch (error) {
        console.error(`Failed to fetch documents: ${error}`);
    }      
}

// Export rendition
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

// Generate variation
async function generateVariation(id, variationDetails) {
    let body = {
        id, 
        variationDetails     
    }
        
    let resp = await fetch(`${BASE}/beta/generate-variation`, {
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

// Call each API and poll for result when necessary
console.log("\n\n\n**** GET TAGGED DOCUMENTS ****\n");
await getTaggedDocuments();

console.log("\n\n\n**** EXPORTING RENDITION OF ORIGINAL DOCUMENT ****\n");
result = await exportRendition(documentId, pages, options);
console.log(result);
getJobResult(result, 'export-rendition');

console.log("\n\n\n**** GENERATING VARIATION ****\n");
let result = await generateVariation(documentId, variationDetails);
console.log(result);
getJobResult(result, 'generate-variation');

async function getJobResult(result, endpoint) {
    // If the status URL is present, poll the job until it is complete
    if (result.statusUrl) {
        let jobResult = await pollJob(result.statusUrl, process.env.API_KEY, process.env.AUTH_TOKEN);
        console.log(jobResult);
        if (jobResult.status === 'succeeded') {
            if (endpoint==='generate-variation') {
                console.log(`\t-> Generated Variation Successful - new document ID: ` + jobResult.document.id + ` URL ${jobResult.document.thumbnailUrl}`);
                // Now export the rendition of the generated variation
                console.log("\n\n\n**** Now exporting rendition of generated variation ****\n");
                await delay(3000); // wait for 3 seconds to ensure the variation is ready
                result = await exportRendition(jobResult.document.id, pages, options);
                console.log(result);
                getJobResult(result, 'export-rendition');
            }
            if (endpoint==='export-rendition') {
                console.log(`\t-> Opening Exported Rendition ${jobResult.pageRenditionsResult[0].renditionUrl}`);
                open(jobResult.pageRenditionsResult[0].renditionUrl);
            }            
        } else {
            console.log(endpoint + ` job failed with status: ${jobResult.status}`);
        }
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
                'X-API-KEY': process.env.API_KEY,
            }
        });

        let data = await resp.json();
        status = data.status;

        // delay is a utility to 'pause' for X ms
        if (status !== 'succeeded' && status !== 'failed') await delay(5000);
        if (status === 'succeeded') return data;
    }

    return status;
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
  import open from 'open';
  ```

- **Set Up Constants and Headers**

  ```js
  let BASE = 'https://express-api.adobe.io';
  const headers = {
        'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
        'X-API-KEY': process.env.API_KEY
  };
  ```

- **Fetch Tagged Documents**

  Fetch tagged documents and print the details to the console:

  ```js
  async function getTaggedDocuments() {        
    try {
        const url = `${BASE}/beta/tagged-documents?start=0&limit=10&sortBy=modifiedDate`;        
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Process the documents
        const documents = data.documents || [];
        documents.forEach(doc => {
          console.log(`\tTagged Doc ID: ${doc.id}, Name: ${doc.name}, Thumbnail URL: ${doc.thumbnailUrl}`);
        });
    } catch (error) {
        console.error(`Failed to fetch documents: ${error}`);
    }
  }
  ```

- **Generate a Variation**

  Generate a variation of the document with the supplied document ID and variation details:

  ```js
  async function generateVariation(id, variationDetails) {       
    let body = {
        id, 
        variationDetails     
    }
        
    let resp = await fetch(`${BASE}/beta/generate-variation`, {
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
  ```

- **Export a Rendition**

  Export a rendition of the document with the supplied document ID, pages, and options:

  ```js
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
  ```

- **Polling Job Results**

 Poll for the job status until it is complete. If the job status is "succeeded", open the exported rendition or generated variation returned in the browser:

  ```js
  async function getJobResult(result, endpoint) {
    // If the status URL is present, poll the job until it is complete
    if (result.statusUrl) {
        let jobResult = await pollJob(result.statusUrl, process.env.API_KEY, process.env.AUTH_TOKEN);
        console.log(jobResult);
        if (jobResult.status === 'succeeded') {
            if (endpoint==='export-rendition') {
                console.log(`\t-> Opening Exported Rendition ${jobResult.pageRenditionsResult[0].renditionUrl}`);
                open(jobResult.pageRenditionsResult[0].renditionUrl);
            }
            if (endpoint==='generate-variation') {
                console.log(`\t-> Generated Variation Successful - new document ID: ` + jobResult.document.id + ` URL ${jobResult.document.thumbnailUrl}`);
                // Now export the rendition of the generated variation
                console.log("\n\n\n**** Now exporting rendition of generated variation ****\n");
                await delay(3000); // wait for 3 seconds to ensure the variation is ready
                result = await exportRendition(jobResult.document.id, pages, options);
                console.log(result);
                getJobResult(result, 'export-rendition');
            }
        } else {
            console.log(endpoint + ` job failed with status: ${jobResult.status}`);
        }
    }
  }
  ```

- **Utility Functions**

  Since the `generate-variation` and `export-rendition` endpoints are asynchronous, we need two utility functions to use for setting a timeout interval to use for polling the job status:

    ```js
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
                    'X-API-KEY': process.env.API_KEY,
                }
            });

            let data = await resp.json();
            status = data.status;

            // delay is a utility to 'pause' for X ms
            if (status !== 'succeeded' && status !== 'failed') await delay(3000); // wait for 3 seconds
            if (status === 'succeeded') return data;
        }

        return status;
    }
    ```

- **API Calls**

  Call each API and print the result to the terminal. For the async API endpoints, poll for the job status at a specified interval (in this example, 1 second, but you can adjust as necessary):

    ```js
    console.log("\n\n\n**** GET TAGGED DOCUMENTS ****\n");
    await getTaggedDocuments();

    console.log("\n\n\n**** GENERATING VARIATION ****\n");
    let result = await generateVariation(documentId, variationDetails);
    console.log(result);
    getJobResult(result, 'generate-variation');

    console.log("\n\n\n**** EXPORTING RENDITION ****\n");
    result = await exportRendition(documentId, pages, options);
    console.log(result);
    getJobResult(result, 'export-rendition');
    ```

## Example Output

When you run the script, you should see output similar to what's shown below, indicating the script is successfully interacting with the endpoints, and processing the documents and tags as expected.

```sh
**** GET TAGGED DOCUMENTS ****

Tagged Doc ID: urn:aaid:sc:VA6C2:15cd5e5a-db4b-5bc8-9b39-9a1d18aafbdf, Name: TemplateExample1.express, Thumbnail URL: https://https://my-bucket.s3.us-east-2.amazonaws.com/thumbnail.jpg

Tagged Doc ID: urn:aaid:sc:VA6C2:8f92cec4-4241-3bef-b2ce-e5c5884d5c18, Name: TemplateExample2.express.express, Thumbnail URL: https://https://my-bucket.s3.us-east-2.amazonaws.com/thumbnail.jpg

**** GENERATING VARIATION ****
{
  jobId: '76b87e58-e3c0-4929-8fd1-4f6f390544bc',
  statusUrl: 'https://express-api.adobe.io/status/76b87e58-e3c0-4929-8fd1-4f6f390544bc'
}

{
  jobId: '76b87e58-e3c0-4929-8fd1-4f6f390544bc',
  status: 'succeeded',
  document: {
    name: 'New wine variation (15).express',
    id: 'urn:aaid:sc:VA6C2:5b563ed1-1396-31b4-8df2-6f61bda55e7e',
    thumbnailUrl: 'https://cpf-temp-repo-ue1-stg.s3.amazonaws.com/76719c63-e3ee-4589-ad5d-0781951edbd5?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250220T210124Z&X-Amz-SignedHeaders=host&X-Amz-Expires=86400&X-Amz-Credential=AKIAU3E5TYZ25GESBC6D%2F20250220%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=d2a765dec2ec576c168030851c7e2e57a909c873b72fa9865023c473f0affc7f'
  }
}

-> Opening Generated Variation Thumbnail http://my-bucket.s3.us-east-2.amazonaws.com/thumbnail.jpg

**** EXPORTING RENDITION ****
{
  jobId: '9736e049-e48b-4b08-8434-0e61f110de47',
  status: 'succeeded',
  id: 'urn:aaid:sc:VA6C2:d8638bc5-33d0-3aaf-9e08-9932a8fccf0f',
  pageRenditionsResult: [
    {
      renditionUrl: 'https://example.com/renditions/rendition.jpg',
      pageNumber: 1
    }
  ]
}
{
  jobId: '9736e049-e48b-4b08-8434-0e61f110de47',
  statusUrl: 'https://express-api.adobe.io/status/9736e049-e48b-4b08-8434-0e61f110de47'
}

 -> Opening Exported Rendition http://my-bucket.s3.us-east-2.amazonaws.com/rendition.jpg
```
