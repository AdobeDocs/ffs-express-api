---
title: Adobe Express API FAQ
description: Frequently asked questions about using the Adobe Express API.
keywords:
  - Adobe Express
  - Adobe Express API
  - FAQ
contributors:
  - https://github.com/hollyschinsky
  - https://github.com/nimithajalal
hideBreadcrumbNav: true
---

# Adobe Express API FAQ

Answers to the most common questions about the Adobe Express API. If you don't see your question here, [contact support](../index.md).

## Access and onboarding

### How do I request access?

Fill out the [Express API Beta Access Request Form](https://airtable.com/appiNBn2w6uT0cpkR/pag3db7joqgtwXSOv/form). If you're already a Firefly Services customer and your administrator has provisioned you, you can [create your credentials](../../create-credentials/index.md) in the Adobe Developer Console.

<InlineAlert variant="info" slots="text" />

If you create credentials in the Developer Console before filling out the form, we'll reach out so you can complete it.

### Will Adobe need to approve my integration?

The beta program is for testing and evaluation only. Don't deploy projects that depend on beta APIs to production.

### I participated in the alpha—what do I need to do?

The private alpha endpoints will remain active for a few more weeks. Migrate to the beta APIs as soon as you can—we'll reach out with a specific deadline. If you don't have access to Firefly Services and can't make the switch, [let us know](../index.md).

### Can I request a higher rate limit?

Yes. Contact your account manager or fill out the [Express API Rate Limit Increase Form](https://airtable.com/appiNBn2w6uT0cpkR/pag5hZ3oDcxrjUbH8/form), and we'll evaluate your request. See [Rate Limits](../../rate-limits/index.md) for current defaults.

### How do I use the Adobe Express API?

First, get your API key and access token. Then send requests to the API endpoints using the appropriate HTTP methods and parameters. See the [Getting Started](../../../guides/index.md) guide for step-by-step instructions.

## About the API

### What is the Adobe Express API?

The Adobe Express API is a set of RESTful APIs that let you interact with Adobe Express programmatically. Adobe Express is a web-based design tool for creating professional-quality graphics, videos, and web pages. The API provides endpoints for creating, updating, and managing documents, and for retrieving information about tagged elements.

### What use cases does the Adobe Express API support?

The Adobe Express API supports a wide range of use cases, including:

- Retrieving information about tagged elements within documents.
- Exporting document renditions in different formats.
- Generating variations of existing documents.
- Managing and updating documents programmatically.
- Automating document creation and editing workflows.
- Integrating Adobe Express with other applications and services.

### What are the key features of the Adobe Express API?

The key features of the Adobe Express (beta) API are:

- [Get details of a tagged document](../../../api/alpha-tagged-documents-documentId/index.md)
- [Get all tagged documents](../../../api/alpha-tagged-documents/index.md)
- [Generate variation](../../../api/alpha-generate-variation/index.md)
- [Export rendition](../../../api/alpha-export-rendition/index.md)
- **Get Job Status:** Check the status of a job submitted to the Adobe Express API. The response includes the job's current status and any error messages from processing.

## Renditions and exports

### What formats can I export?

The Export Rendition API supports `JPG`, `PNG`, and `MP4` formats. Pass a document ID, and you'll get a pre-signed URL for each page rendition along with a status URL to track progress.

- Image URLs are valid for 4 hours, with sizes up to 8192px.
- Video URLs are valid for 24 hours, with sizes up to 4096px.

### What's the maximum supported size for renditions?

Image renditions max out at 8192px, and video renditions at 4096px. Requests above these limits return an error.

<InlineAlert variant="warning" slots="text1" />

- Rendition size is capped at the original document dimensions. Image renditions can be specified up to 8192px on the longest side, with aspect ratio maintained.
- Renditions can be downscaled but not upscaled. For example, with a 1024 x 1024 document, renditions from 1 x 1 up to 1024 x 1024 are supported—any size value over 1024 produces a 1024 x 1024 output.

### How long are pre-signed rendition URLs valid?

Image rendition URLs (`renditionUrl`) are valid for 4 hours. Video rendition URLs are valid for 24 hours. Download or consume the rendition within that window.

### How long are thumbnail URLs valid for generating variations?

Thumbnail URLs returned in the Generate Variation response are valid for 24 hours. Download or consume them within that window.

## Documents and storage

### How long are generated documents stored?

Generated documents are stored in an **Express API Documents** folder for 30 days, after which they're deleted automatically. To keep a document longer, move or copy it to another location within the 30-day window.

### What is a document URN?

A document URN (Uniform Resource Name) is a unique, persistent identifier for a digital document. It stays valid even if the document's location or access method changes.

### What storage options are supported for tag mappings?

The `tagMappings` field supports pre-signed URLs from `AWS`, `Dropbox`, and `Azure (windows.net)`. An example tag mapping looks like this:

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

## Troubleshooting

### Why does `/beta/tagged-documents` return an empty array?

If you're getting an empty array from the [tagged documents API](../../../api/alpha-tagged-documents/index.md), check that you've saved your changes after [tagging the elements in your document](../../../guides/how-to/tag-documents.md#step-2-create-tags-for-a-document).
