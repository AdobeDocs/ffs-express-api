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

The Express API endpoints currently only operate on the Express documents tagged for automation workflows; use the **Data Fields** native functionality to add tags, as explained in [this guide](./how-to/tag-documents.md).

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

1. [**Create and Tag a Document**](./how-to/tag-documents.md):
   - Create a new Express document or open an existing one.
   - Design your document with the elements you want to modify via API.
   - Select an element (text, image or video), right-click and click **Assign data field** to open the **Data fields** panel.
   - Enter a descriptive tag name in the input field (this will be the identifier in API calls).
   - Repeat for all elements you want to programmatically modify.
   - Click **Done** at the bottom of the Data fields panel.

## Step 2: Using the Express API

The Express API provides five key endpoints:

- [**Tagged documents API**](../api/index.md): Lists the tagged documents you own or that have been shared with you, with pagination and sorting.
- [**Tagged document details API**](../api/index.md): Retrieves a document's pages and the details of its tagged elements (such as size and position).
- [**Create variation API**](../api/index.md): Creates a variation of a tagged template or document by filling in its tagged elements, and renders it as an image, PDF, video, or saved Express document.
- [**Export rendition API**](../api/index.md): Exports pages of an existing document as JPG, PNG, MP4, or PDF.
- [**Status API**](../api/index.md): Checks the status of asynchronous jobs, such as variation creation and exports, and retrieves their results.

### Fetch Tagged Documents Example

This example demonstrates how to retrieve all tagged documents available to your account:

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X GET \
  'https://express-api.adobe.io/v1/tagged-documents?start=0&limit=10&sortBy=name' \
  -H 'Authorization: Bearer <YOUR_TOKEN>' \
  -H 'X-API-KEY: YOUR-API-KEY'
```

#### Response

```json
{
  "documents": [
    {
      "templateOrDocument": {
        "creativeCloudFileId": "urn:aaid:sc:VA6C2:1ee6d0fe-cd84-590f-b064-285b7d6cc051"
      },
      "name": "My Document.express",
      "thumbnailUrl": "https://aep-cs-blobstore-stage-va6c2-data.s3.amazonaws.com"
    }
  ],
  "paging": {
    "nextUrl": "https://<domain>/v1/tagged-documents?start=1&limit=1&sortBy=name",
    "totalRecords": 1
  }
}
```

**Note**: If you receive an empty document list, verify that you have [properly tagged your documents](how-to/tag-documents.md).

### Fetch Document Details Example

Once you have document URNs (`templateOrDocument.creativeCloudFileId`), you can retrieve detailed information about a specific document:

<CodeBlock slots="heading, code" repeat="2" languages="CURL, JSON" />

#### Request

```bash
curl -i -X GET \
  'https://express-api.adobe.io/v1/tagged-documents/<YOUR_DOCUMENT_ID>' \
  -H 'Authorization: Bearer <YOUR_TOKEN>' \
  -H 'X-API-KEY: YOUR-API-KEY'
```

#### Response

```json
{
  "name": "MyDocument",
  "templateOrDocument": {
    "creativeCloudFileId": "urn:aaid:sc:VA6C2:d8638bc5-33d0-3aaf-9e08-9932a8fccf0f"
  },
  "documentPages": [
    {
      "pageNumber": 1,
      "pageTitle": "",
      "thumbnailUrl": "https://aep-cs-blobstore-stage-va6c2-data.s3.amazonaws.com/thumbnail.jpg",
      "size": {
        "width": 1080,
        "height": 1920
      },
      "dataFields": [
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
          },
          "text": "Jane Doe"
        }
      ]
    }
  ]
}
```

The response provides detailed information about each tagged element (data field), including its name, type, position, and dimensions; text fields also return their current value in `text`. This information is essential when creating document variations.

For detailed examples of creating variations and exporting renditions, see the [how-to guides](how-to/tag-documents.md).

## Best Practices and Limitations

For optimal results with the Express API:

- **Document Structure**: Use single-page documents for simpler management and faster processing
- **Tag Naming**: Use descriptive, unique names for your tags to easily identify elements in API calls
- **Thumbnails**: Use the `thumbnailUrl` property to display document previews in your application
- **Pagination**: When dealing with multiple documents, use the `nextUrl` from the `paging` object to implement pagination
- **Error Handling**: Implement robust error handling for API responses, particularly for asynchronous operations

## Next Steps

- Explore the [complete API reference](../api/index.md) for detailed endpoint documentation
- Learn how to [create document variations](how-to/create-variation.md)
- Understand [authentication and security](../getting-started/index.md) for the Express API
