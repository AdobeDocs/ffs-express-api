---
title: Known Issues, Considerations and Limitations
description: This guide helps you to navigate the known issues and limitations with ease for enhanced development efficiency.
keywords:
  - Adobe Express
  - Adobe Express API
  - Export document renditions
  - Document variations
  - Tagged documents
  - Content automation
  - Known issues and limitations
contributors:
  - https://github.com/nimithajalal
hideBreadcrumbNav: true
---

# Known Issues, Considerations and Limitations

This guide helps you to navigate the known issues and limitations with ease for enhanced development efficiency.

## Overview

This document outlines specific considerations, known issues, and limitations associated with the Adobe Express API. It is intended to help developers understand the constraints and considerations when integrating with these APIs to ensure a smooth and efficient development process.

## General Considerations

### Authentication

The APIs require an API key (`X-API-KEY`) and bearer token for authentication.

   - *Example*: When making a request, include the following headers:

```bash
  X-API-KEY: your_api_key
  Authorization: Bearer your_token
```

### Rate Limiting

The APIs support rate limiting with 50 RPM (requests per minute) per client across all the APIs. Learn more about [rate limiting](../../../getting-started/rate-limits/index.md) guidelines. **Note:** If the rate limit is exceeded, any additional requests will receive a `429 Too Many Requests` response.

### Request Identifier

The HTTP header `x-request-id` can be used when making requests to trace information and logs for that request.

   - *Example*: Include the `x-request-id` header in your request:

```bash
  x-request-id: your-request-id
```

## API-Specific Considerations

### Tagged Documents API

- **Pagination Limit**: The default number of pages that will be returned in one API call is 10.

  - *Example*: If you do not specify a pagination input, the response will include only the first 10 pages by default.

- **Tag Names**: Tag names are case-sensitive and must be unique within the same page. Across different pages, tags of the same element type can have the same name.

  - *Example*: On Page 1, you can have a tag named `Header`, and on Page 2, you can also have a tag named `Header`.

- **Thumbnail URLs**: The thumbnail URL returned with the tagged documents list and tagged document details response is valid for 4 hours.

  - *Example*: A thumbnail URL provided in the response might look like this:

    ```json
    {
      "thumbnailUrl": "https://example.com/thumbnail.jpg"
    }
    ```

  Ensure to download or use the thumbnail within **4 hours**.

### Tagged Document Details API

Position coordinates are currently returned relative to the parent element and not relative to the page.
  
Impact:

- Tagged elements in a group
- Images with a crop

  - *Example*: For a text element inside a group at coordinates (100, 100) with respect to the group, if the group itself is positioned at (50, 50) on the page, the API returns the text element's position as (100, 100) instead of its absolute position (150, 150) on the page.
  - *Example*: For a cropped image where the original image is at (200, 200) and the crop area starts at (50, 50) within the image, the API returns the image's position as (200, 200) instead of its absolute position (250, 250) on the page.

### Generate Variation API

- **Document Availability**: Generated documents are temporarily stored in a folder named **"Express API Documents"**. They remain accessible for **30 days**, after which the system automatically removes them.

- **Tag Mappings**: The `tagMappings` field supports pre-signed URLs from `AWS`, `Dropbox`, and `Azure (windows.net)`.

  - *Example*: A tag mapping might look like this:
  
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

- **Thumbnail URLs**: The thumbnail URLs returned with the generate variation response are valid for **24 hours**.

  - *Example*: A thumbnail URL provided in the response might look like this:

    ```json
    {
      "thumbnailUrl": "https://example.com/thumbnail.jpg"
    }
    ```

    Ensure that you download or use the thumbnail within **12 hours**.

### Export Rendition API

- **Supported Formats**: Image formats (JPG, PNG), video format (MP4), and document format (PDF) are supported. PDF exports support standard and print options with optional accessibility and print settings.
- **Rendition Size**: The maximum supported size for image renditions is 8192px and 4096px for video and PDF renditions.

  - If you request a rendition size larger than the maximum limits, the response will return an error.

- **Pre-signed URLs**: The pre-signed URLs provided in the `renditionUrl` (or in `pageRenditionsResult` for export jobs) are valid for **4 hours for image renditions** and **24 hours for video and PDF renditions**.

  - *Example*: A pre-signed URL might look like this:

    ```json
    {
      "renditionUrl": "https://example.com/rendition/page1.jpg"
    }
    ```

Ensure that you download or use the rendition within the specified time frame.

### Job Status API

- **Job Details**: Depending on the job type, the response may include job-specific details.

  - *Example*: A job status response might include details such as job progress, completion time, and any errors encountered.

## Error Handling

- **Common Error Responses**: The APIs return standard error responses, including error codes and error messages.

Learn more about [error handling](../../../getting-started/error-logging/index.md).
