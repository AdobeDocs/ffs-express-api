---
title: How to Troubleshoot Common Adobe Express API Issues
description: This guide provides frequently asked questions and answer for using the Express API.
keywords:
  - Adobe Express
  - Adobe Express API
  - FAQ
contributors:
  - https://github.com/hollyschinsky
  - https://github.com/nimithajalal
hideBreadcrumbNav: true
---

# How to Troubleshoot Common Adobe Express API Issues

Frequently asked questions and answers about the Adobe Express API.

## What is the Adobe Express API?

The Adobe Express API is a set of RESTful API that allow developers to programmatically interact with Adobe Express, a web-based design tool that enables users to create professional-quality graphics, videos, and web pages. The API provides endpoints for creating, updating, and managing documents, as well as retrieving information about tagged elements within documents.

## How do I use the Adobe Express API?

To use the Adobe Express API, you need to obtain an API key and an access token. You can then make requests to the API endpoints using the appropriate HTTP methods and parameters. Refer to the [Getting Started](../../guides/index.md) guide for detailed instructions on how to use the Adobe Express API.

## What are the supported formats for exporting renditions?

The Export Rendition API currently supports exporting document renditions in `JPG`, `PNG`, and `MP4` formats 
This API allows users to export a document, identified by its document ID, in `JPG`, `PNG`, and `MP4` formats.  It provides pre-signed URLs for each page rendition. Image URLs are valid for 4 hours with sizes up to 8192px. Video URLs are valid for 24 hours with sizes up to 4096px. A status URL is included to track export progress.

## How long are pre-signed URLs valid for rendition URLs?

The pre-signed URLs returned via `renditionUrl` for image renditions are valid for 4 hours, and for video renditions, they are valid for 24 hours. Ensure to use or download the rendition within this time frame.

## How long are thumbnail URLs valid for generating variations?

The thumbnail URLs returned along with the generate variation response are valid for 24 hours. Ensure to use or download the thumbnail within this time frame.

## What is the maximum supported size for exported renditions?

The maximum supported size for image renditions is 8192px, and 4096px for video renditions. If you request a rendition size larger than the maximum limit, the response will return an error.

<InlineAlert variant="warning" slots="text1" />

- Rendition size is capped at original document dimensions. Image renditions can be specified up to 8192px on the longest side, with aspect ratio maintained. 
- Rendition sizes are constrained to the original document dimensions, allowing for downscaling but not upscaling. For example, with a 1024 x 1024 document, renditions from 1 x 1 up to 1024 x 1024 are supported, while any size value exceeding 1024 will produce a 1024 x 1024 output.

## What is the max duration generated documents are stored?

Generated documents are temporarily stored in a folder named **"Express API Documents"** and available for 30 days. After this period, the system automatically deletes them. You can move or copy the document(s) to any other location to persist indefinitely. Ensure to move or copy the document within 30 days.

## What storage options are supported for tag mappings?

The `tagMappings` field supports pre-signed URLs from `AWS`, `Dropbox`, and `Azure (windows.net)`. An example tag mapping might look like this:

```json
{
  "tagMappings":
    {
      "imageTag": "PRE-SIGNED URL",
      "textTag": "Hello World",
      "videoTag": "PRE-SIGNED VIDEO URL"
    }
}
```

## What is a document URN?

A document URN (Uniform Resource Name) is a unique, persistent identifier assigned to a digital document, allowing it to be identified reliably even if its location or access method changes.

## What use cases are supported by the Adobe Express API?

The Adobe Express API supports a wide range of use cases, including:

- Retrieving information about tagged elements within documents.
- Exporting document renditions in different formats.
- Generating variations of existing documents.
- Managing and updating documents programmatically.
- Automating document creation and editing workflows.
- Integrating Adobe Express with other applications and services.

## What are the key features of the Adobe Express API?

The key features of Adobe Express (Alpha) API are below:

- [Get details of a tagged-document](../../index.md#get-details-of-a-tagged-document)
- [Get all tagged documents](../../index.md#get-all-tagged-documents)
- [Generate variation](../../index.md#generate-variation)
- [Export rendition](../../index.md#export-rendition)
- Get Job Status: The Job Status API allows users to check the status of a job that was submitted to the Adobe Express API. The API returns information about the job, including its current status, and any error messages that may have occurred during processing.

## Why am I getting empty array when using [`/alpha/tagged-documents`](../../api/alpha-tagged-documents/).?

When using the tagged documents API, if you're receiving an empty array in the response, check the following:

- Make sure to save changes after [tagging the elements in the documents](../../guides/how-to/tag-documents.md#step-2-create-tags-for-a-document).
