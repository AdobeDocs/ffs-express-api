---
title: Get tagged elements in your documents
description: This guide shows you how to retrieve tag elements in your documents.
keywords:
  - Adobe Express
  - Adobe Express API
  - Tag elements
  - Tag document
  - Tag template
contributors:
  - https://github.com/hollyschinsky
  - https://github.com/nimithajalal
hideBreadcrumbNav: true
---

# Get Tagged Documents

Learn how to retrieve a list of tagged documents available for the user.

## Overview

In this tutorial, we'll walk you through the process of fetching tagged documents using the Adobe Express API in Node.js. We'll cover everything from creating and tagging documents, to setting up your Node.js environment and fetching tagged documents.

By the end of this tutorial, you'll be able to dynamically update and manage your documents programmatically, making your workflow more efficient and streamlined.

Let's get started!

## Step 1: Creating Documents and Enabling Tags

Use the [how to create tags guide](tag-documents.md) guide to tag your document with the [Tag Elements Add-on](https://adobesparkpost.app.link/TR9Mb7TXFLb?mode=private&claimCode=wjmj67nj9:PLYN7XLJ), then copy the `Document ID` from the add-on for further use.

## Step 2: Fetching Tagged Documents

**Prepare the Request Payload**:

Use the following `curl` command to fetch tagged documents:

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
     curl -i -X GET
       'https://express-api.adobe.io/beta/tagged-documents?start=0&limit=5&sortBy=name'
       -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' 
       -H 'X-API-KEY: YOUR_API_KEY_HERE'
```

#### Response

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

This should return an array of `id`'s (document URNs) available for the user. If this returns an empty list, ensure you have first [created and tagged your documents using the Tag Elements Add-on](tag-documents.md).

## Step 3: Using the Tagged Documents

1. **Access the Tagged Documents**:

   - Use the `id` and `name` fields from the response to identify and work with your tagged documents.
   - The `thumbnailUrl` can be used to display a preview of the document.

2. **Pagination**:

   - If there are multiple pages of results, use the `nextUrl` from the `paging` object to fetch the next set of documents.

## Use Cases

### Use Case 1: Dynamic Content Updates

Imagine you have a marketing campaign where you need to update the text, images or videos in your documents frequently. By tagging elements in your documents, you can programmatically create new documents with the updated content using the Express API without manually editing each document.

### Use Case 2: Discovery

As a Brand Marketer creating marketing materials in bulk, you can identify which documents are available for dynamic content updates by fetching tagged documents to use in creating new variations.

## Using Node.js to fetch tagged documents

### Step 1: Set Up Your Environment

First, run the following commands in a secure terminal:

```bash
export API_KEY=yourApiKeyHere
export AUTH_TOKEN=yourTokenHere

mkdir adobe-express-api-tutorial
cd adobe-express-api-tutorial
npm init -y
touch index.mjs
```

### Step 2: Retrieve tagged documents with Node.js script

Copy and paste the code below into the `index.mjs` file created above, then run it with `node index.mjs` from the command line.

```javascript
// Define the API endpoint and headers
const url = 'https://express-api.adobe.io/beta/tagged-documents?start=0&limit=5&sortBy=name';

const headers = {
  'Authorization': `Bearer ${process.env.AUTH_TOKEN}`,
  'X-API-KEY': process.env.API_KEY
};

try {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log("Document data ", data);

  // Process each document
  const documents = data.documents || [];
  documents.forEach(doc => {
    console.log(`ID: ${doc.id}, Name: ${doc.name}, Thumbnail URL: ${doc.thumbnailUrl}`);
  });
} catch (error) {
  console.error(`Failed to fetch documents: ${error}`);
}
```

This Node.js script fetches all tagged documents, then processes and prints the details of each document to the terminal.

## Next steps

Now that you have access to your tagged documents, you can use a document ID to perform further operations, including:

- [Exporting a rendition](export-document.md) of your document using the document ID.

- [Generating variations](generate-variations.md) of your document using the document ID, along with your desired variation details.
