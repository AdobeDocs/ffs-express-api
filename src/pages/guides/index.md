---
title: Getting Started Guide - Express API
description: A comprehensive guide to integrating Adobe Express functionality into your applications using the Express API.
keywords:
  - Adobe Express
  - Adobe Express API
  - Getting started
  - REST API
  - Document tagging
contributors:
  - https://github.com/nimithajalal
  - https://github.com/hollyschinsky
hideBreadcrumbNav: true
---

# Getting Started with Express API

Express API enables you to integrate Adobe Express functionalities into your applications through a REST API. This guide walks you through the setup process, provides usage examples, and outlines best practices.

## Overview

The Express API allows you to programmatically interact with Adobe Express documents that have been tagged for automation. By tagging specific elements (text, images, and videos) in your Express documents, you can modify them via API calls to create customized variations and generate renditions.

The Express API endpoints currently only operate on the Express documents tagged for automation workflows. The [Tag Elements Add-on](https://adobesparkpost.app.link/TR9Mb7TXFLb?mode=private&claimCode=wjmj67nj9:PLYN7XLJ) facilitates the functionality of tagging elements in an Express document, enabling the document for automation.

## Terminology

- **Document/Template**: An Adobe Express document containing design elements that can be tagged for API access
- **Document URN**: A unique, persistent identifier for Express documents (format: `urn:aaid:sc:VA6C2:...`)
- **Tagged Element**: A text, image or video element that has been named and marked for programmatic access
- **Rendition**: An exported version of a document (JPG, PNG, MP4, and PDF formats are supported)
- **Variation**: A modified version of a document with changes to its tagged elements

## Prerequisites

Before you begin:

1. **Adobe Express Account**: Ensure you have access to [Adobe Express](https://new.express.adobe.com/)
2. **Authentication**: Obtain an access token with `openid`, `AdobeID`, and `ee.express_api` scopes. See [authentication documentation](../getting-started/index.md)
3. **API Key**: [Register your application](https://developer.adobe.com/console) to receive an API key
4. **Required Headers**: Include these in every API request:

   ```bash
   X-API-KEY: "YOUR-API-KEY"
   Authorization: "Bearer <Authorization Token>"
   ```

## Step 1: Preparing Documents for API Access

1. **Install the Add-on**:
   - Log into [Adobe Express](https://new.express.adobe.com/)
   - Install the [Tag Elements Add-on](https://adobesparkpost.app.link/TR9Mb7TXFLb?mode=private&claimCode=wjmj67nj9:PLYN7XLJ) by opening the URL and clicking **ADD**
   - Find the add-on in the **Add-ons section** under **Your add-ons**

2. **Create and Tag a Document**:
   - Create a new Express document or open an existing one
   - Design your document with the elements you want to modify via API
   - Open the Tag Elements Add-on
   - Select an element (text, image or video)
   - Enter a descriptive tag name in the input field (this will be the identifier in API calls)
   - Click **Create tag**
   - Repeat for all elements you want to programmatically modify

## Step 2: Using the Express API

The Express API provides five key endpoints:

- [**Tagged documents API**](../api/index.md): Lists all your tagged documents
- [**Tagged document details API**](../api/index.md): Retrieves metadata and tagged element information for a specific document
- [**Generate variation API**](../api/index.md): Creates a new document variation by modifying tagged elements
- [**Export rendition API**](../api/index.md): Exports a document as JPG, PNG, MP4, or PDF
- [**Status API**](../api/status-jobId/index.md): Checks the status of asynchronous operations like variation generation

### Fetch Tagged Documents Example

This example demonstrates how to retrieve all tagged documents available to your account:

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X GET \
  'https://express-api.adobe.io/beta/tagged-documents?start=0&limit=10&sortBy=name' \
  -H 'Authorization: Bearer <YOUR_TOKEN>' \
  -H 'X-API-KEY: YOUR-API-KEY'
```

#### Response

```json
{
  "documents": [
    {
      "id":"urn:aaid:sc:VA6C2:1ee6d0fe-cd84-590f-b064-285b7d6cc051",
      "name": "My Document.express",
      "thumbnailUrl": "https://aep-cs-blobstore-stage-va6c2-data.s3.amazonaws.com"
    }
  ],
  "paging": {
    "nextUrl": "https://<domain>/beta/tagged-documents?start=1&limit=1&sortBy=name",
    "totalRecords": 1
  }
}
```

**Note**: If you receive an empty document list, verify that you have [properly tagged your documents](how-to/tag-documents.md).

### Fetch Document Details Example

Once you have document IDs, you can retrieve detailed information about a specific document:

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X GET \
  'https://express-api.adobe.io/beta/tagged-documents/<YOUR_DOCUMENT_ID>' \
  -H 'Authorization: Bearer <YOUR_TOKEN>' \
  -H 'X-API-KEY: YOUR-API-KEY'
```

#### Response

```json
{
  "name": "MyDocument",
  "id": "urn:aaid:sc:VA6C2:d8638bc5-33d0-3aaf-9e08-9932a8fccf0f",
  "documentPages": [
    {
      "pageNumber": 1,
      "pageTitle": "",
      "thumbnailUrl": "https://aep-cs-blobstore-stage-va6c2-data.s3.amazonaws.com/thumbnail.jpg",
      "size": {
        "width": 1080,
        "height": 1920
      },
      "taggedElements": [
        {
          "name": "logoImage",
          "type": "image",
          "position": {
            "x": 380.13818359375,
            "y": 1211.0332407951355
          },
          "size": {
            "width": 292.2994079589844,
            "height": 222.86627197265625
          }
        },
        {
          "name": "nameLabel",
          "type": "text",
          "position": {
            "x": 386,
            "y": 982.5430908203125
          },
          "size": {
            "width": 252.43186950683594,
            "height": 70.70060157775879
          }
        }        
      ]
    }
  ]
}
```

The response provides detailed information about each tagged element, including its name, type, position, and dimensions. This information is essential when generating document variations.

For detailed examples of generating variations and exporting renditions, see the [how-to guides](how-to/tag-documents.md).

## Best Practices and Limitations

For optimal results with the Express API:

- **Document Structure**: Use single-page documents for simpler management and faster processing
- **Tag Naming**: Use descriptive, unique names for your tags to easily identify elements in API calls
- **Thumbnails**: Use the `thumbnailUrl` property to display document previews in your application
- **Pagination**: When dealing with multiple documents, use the `nextUrl` from the `paging` object to implement pagination
- **Error Handling**: Implement robust error handling for API responses, particularly for asynchronous operations

## Next Steps

- Explore the [complete API reference](../api/index.md) for detailed endpoint documentation
- Learn how to [generate document variations](how-to/generate-variations.md)
- Understand [authentication and security](../getting-started/index.md) for the Express API
