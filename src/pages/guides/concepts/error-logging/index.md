---
title: Error logging - Express API
description: This guide is a quick reference for resolving Express API error codes efficiently .
keywords:
  - Adobe Express
  - Create Credentials
  - Credentials
  - Authentication
  - Authorization
  - Adobe Express API
  - Developer documentation
contributors:
  - https://github.com/nimithajalal
hideBreadcrumbNav: true
---

# Error Logging

Quick reference for resolving Express API error codes efficiently.

## Overview

This guide provides a detailed overview of the error codes you may encounter using our Express API. It categorizes the error codes into successful responses and client and server errors.

### How to Use This Guide

1. Identify the error code and message you received
2. Look up the error in the relevant category
3. Follow the suggested resolution steps
4. Use the code examples as reference

## Error Response Structure

All API error responses follow a consistent structure:

```json
{
  "error_code": "error code",
  "message": "Message for user",
  "validation_errors": ["Validation error messages as an array of strings."]
}
```

### Field Descriptions

- **error_code**: Unique identifier for the error type
- **message**: Human-readable description of the error
- **validation_errors**: (Optional) Array of strings with validation failure details
  - Only present for validation errors (422)
  - Contains specific field-level error messages

## Common Scenarios

### Authentication Issues

- **Symptom**: 401 Unauthorized errors
- **Common Causes**:
  - Missing authentication token
  - Expired token
  - Invalid token format
- **Resolution Steps**:
  1. Verify token presence
  2. Check token expiration
  3. Validate token format

### Rate Limiting

- **Symptom**: 429 Too Many Requests
- **Resolution**:

  1. Implement exponential backoff
  2. Cache responses where possible
  3. Monitor usage patterns

## Successful Response Examples

### 200 OK

Your request has been completed.

<CodeBlock slots="heading, code" repeat="3" languages="JSON, JSON, JSON" />

#### GET /alpha/tagged-documents

```json
{
  "documents": [
    {
      "id": "urn:aaid:sc:AP:0000aaaa-0000-000a-0000-000000aaaaaa",
      "name": "Sample Document",
      "thumbnailUrl": "https://aep-cs-blobstore-stage-jpn3-data.s3-ap-northeast-1.amazonaws.com/0daeb5c1-1f95-434e-8de1-16181b98e8fe?x-region=jpn3&x-version-id"
    }
  ],
  "paging": {
    "totalRecords": 1,
    "nextUrl": ""
  }
}
```

#### GET /alpha/tagged-documents/{documentId}

```json
{
  "name": "Sample Document",
  "id": "urn:aaid:sc:AP:0000aaaa-0000-000a-0000-000000aaaaaa",
  "documentPages": [
    {
      "pageNumber": 1,
      "pageTitle": "",
      "thumbnailUrl": "https://aep-cs-blobstore-stage-jpn3-data.s3-ap-northeast-1.amazonaws.com/0daeb5c1-1f95-434e-8de1-16181b98e8fe?x-region=jpn",
      "size": {
        "width": 1080,
        "height": 1920
      },
      "taggedElements": [
        {
          "name": "TagOne",
          "type": "text",
          "position": {
            "x": 243.00001525878906,
            "y": 979.9854736328125
          },
          "size": {
            "width": 215.67306518554688,
            "height": 68.75729370117188
          }
        },
        {
          "name": "TagTwo",
          "type": "text",
          "position": {
            "x": 233.5640869140625,
            "y": 1310.9854736328125
          },
          "size": {
            "width": 218.76632690429688,
            "height": 68.75729370117188
          }
        }
      ]
    }
  ]
}
```

#### GET /status/{jobId}

```json
{
  "jobId": "46f1039a-0822-4652-9a1b-b08b1a2b5173",
  "status": "succeeded",
  "id": "urn:aaid:sc:AP:59a259d1-5c1e-3110-a6fb-00a00000000",
  "pageRenditionsResult": [
    {
      "renditionUrl": "https://aep-cs-blobstore-stage-jpn3-data.s3-ap-northeast-1.amazonaws.com/7e705f70-738e-40f9-b3ef-03b4b6089e9c?x-region=jpn3",
      "pageNumber": 1
    }
  ]
}
```

### 202 Accepted

The request has been accepted for processing. Check the status using `GET /status/{jobId}`.

#### POST /alpha/generate-variation

```json
{
  "jobId": "46f1039a-0822-4652-9a1b-b08b1a2b5173",
  "statusUrl": "https://express-api.adobe.io/status/46f1039a-0822-4652-9a1b-b08b1a2b5173"
}
```

## Error Code Categories

- Client Errors (4xx)
  - Validation Errors (`422`)
- Server Errors (5xx)

## Error Codes and Descriptions

### Client Errors (4xx)

These errors indicate issues with the request made by the client.

| Error Code | Name                  | Message                                                                                                                                                                         | What to Do?                                                                                                                              |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `400`      | Bad Request           | We cannot process the request due to a client error.                                                                                                                            | Check the request syntax and ensure it includes all required parameters. Check out the [API references](../../../api/index.md).          |
| `401`      | Unauthorized          | The client needs to authenticate the request to move further.                                                                                                                   | Ensure that the authentication token is included and valid. Learn more about [authenticating your requests](../authentication/index.md). |
| `403`      | Forbidden             | The server understands the request, but the client does not have permission to access the resource—missing or insufficient permissions for the authenticated user cause this.   | Ensure the token used is for the same user accessing the document. Check if the user has access to the requested document.               |
| `404`      | Not Found             | The server could not find the requested resource. This error could happen if the requested URL or endpoint does not exist, is misspelled, or is inaccessible to the user.       | Check the URL and ensure the resource exists.                                                                                            |
| `422`      | Unprocessable Content | The server understands the request but cannot process it due to semantic errors or invalid data. This error often happens when input is invalid or required fields are missing. | Review the validation errors for each endpoint and correct the request data accordingly.                                                 |
| `429`      | Too Many Requests     | You have sent too many requests in a given time (rate limiting).                                                                                                                | Reduce the request rate and try again later. Learn more about [rate limits](../rate-limits/index.md).                                    |

### Validation Errors (`422`)

In a `422` error, you will get validation errors specific to different endpoints.

| Endpoint                                   | Validation Error Messages                                                                                                                                                                      | What to Do?                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GET /alpha/tagged-documents`              | `json { "error_code": "validation_error", "message": "Validation error", "validation_errors": [ "start must not be less than 0" ] }`                                                           | Check for the page index and ensure that it is valid.                                                                   |
| `GET /alpha/tagged-documents/{documentId}` | `json { "error_code": "validation_error", "message": "Validation error", "validation_errors": [ "The 'start' value must be greater than or equal to 1", "start must be a positive number"] }`  | Check whether the index is valid.                                                                                       |
| `POST /alpha/generate-variation`           | `json { "error_code": "validation_error", "message": "Validation error", "validation_errors": [ "property variationDetail should not exist", "variationDetails must be a non-empty object"] }` | Check that the request body has the correct fields.                                                                     |
| `POST /alpha/export-rendition`             | `json { "error_code": "validation_error", "message": "Invalid start page. Document contains 1 pages" }`                                                                                        | Check whether the request page index is valid.                                                                          |
|                                            | `json { "error_code": "validation_error", "message": "Validation error", "validation_errors": [ "options.format must be one of the following values: image/jpeg, image/png, video/mp4, or application/pdf" ] }`               | Check the chosen format is correct.                                                                               |
| `GET /status/{jobId}`                      | `json { "error_code": "unknown_job_id", "message": "Unknown job Id" }`                                                                                                                         | Check the `jobId` requested is a valid id generated from `/alpha/generate-variation` and `/alpha/export-rendition` API. |

### Server Errors (5xx)

These errors indicate issues with the server.

| Error Code | Name                  | Message                                                  | What to Do?                                                                                                                   |
| ---------- | --------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `500`      | Internal Server Error | The server had an unexpected error.                      | Ensure the request was sent with the `x-request-id` header. Check server logs for more details and fix any underlying issues. |
| `503`      | Service Unavailable   | The service is temporarily unable to handle the request. | Retry the request after some time or check the server status.                                                                 |

## Developer-Specific examples

Let us look at some examples.

### Example 1: Handling a `401` Error for `GET /alpha/tagged-documents`

For example, one might see this error if the authentication token is not included or is invalid.

**Request:**

```sh
GET /alpha/tagged-documents
```

**Response:**

```json
{
  "error": {
    "code": "401",
    "message": "Unauthorized",
    "details": "Authentication token is missing or invalid."
  }
}
```

**Solution:** Include a valid authentication token in the request header.

**Corrected Request:**

```bash
GET /alpha/tagged-documents
Authorization: Bearer your-auth-token
```

### Example 2: Handling a `422` Error for `POST /alpha/generate-variation`

#### Sample code 1

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Request

```json
{
  "id": "urn:aaid:sc:AP:0000aaaa-0000-000a-0000-000000aaaaaa",
  "variationDetails": {
    "pages": "10",
    "preferredDocumentName": "Generated Document 1",
    "tagMappings": {
      "imageTag": "https://www.adobe.com/image.jpg",
      "textTag": "Hello World"
    }
  }
}
```

#### Response

```json
{
  "error_code": "validation_error",
  "message": "Invalid start page. Document contains 1 pages"
}
```

**Solution:** Correct the validation errors in the request data.

**Corrected Request:**

```json
{
  "id": "urn:aaid:sc:AP:0000aaaa-0000-000a-0000-000000aaaaaa",
  "variationDetails": {
    "pages": "1",
    "preferredDocumentName": "Generated Document 1",
    "tagMappings": {
      "imageTag": "https://www.adobe.com/image.jpg",
      "textTag": "Hello World"
    }
  }
}
```

#### Sample code 2

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Request

```json
{
  "id": "urn:aaid:sc:AP:59a259d1-5c1e-3110-a6fb-00a00000000",
  "variationDetail": {
    "pages": "1",
    "tagMappings": {
      "TagOne": "TagOne NewValue",
      "TagTwo": "TagTwo NewValue"
    },
    "preferredDocumentName": "E2E Generated Document"
  }
}
```

#### Response

```json
{
  "error_code": "validation_error",
  "message": "Validation error",
  "validation_errors": [
    "property variationDetail should not exist",
    "variationDetails must be a non-empty object"
  ]
}
```

**Solution:** Correct the field name in the request data.

**Corrected Request:**

```json
{
  "id": "urn:aaid:sc:AP:59a259d1-5c1e-3110-a6fb-00a00000000",
  "variationDetails": {
    "pages": "1",
    "tagMappings": {
      "TagOne": "TagOne NewValue",
      "TagTwo": "TagTwo NewValue"
    },
    "preferredDocumentName": "E2E Generated Document"
  }
}
```

### Example 3: Handling a `422` Error for `POST /alpha/export-rendition`

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Request

```json
{
  "id": "urn:aaid:sc:AP:59a259d1-5c1e-3110-a6fb-00a00000000",
  "pages": "1-",
  "options": {
    "format": "image/jpg"
  }
}
```

#### Response

```json
{
  "error_code": "validation_error",
  "message": "Validation error",
  "validation_errors": [
    "options.format must be one of the following values: image/jpeg, image/png, video/mp4, or application/pdf"
  ]
}
```

**Solution:** Input the right format for `options`.

**Corrected Request:**

```json
{
  "id": "urn:aaid:sc:AP:59a259d1-5c1e-3110-a6fb-00a00000000",
  "pages": "1-",
  "options": {
    "format": "image/jpeg"
  }
}
```

## Code Examples

<CodeBlock slots="heading, code" repeat="2" languages="NODEJS, PYTHON" />

#### Error handling

```javascript
async function makeApiRequest() {
  try {
    const response = await fetch("https://express-api.adobe.io/endpoint", {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-request-id": requestId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();

      switch (errorData.error_code) {
        case "401":
          // Handle authentication error
          await refreshToken();
          return makeApiRequest();
        case "429":
          // Handle rate limiting
          const retryAfter = response.headers.get("Retry-After");
          await delay(retryAfter * 1000);
          return makeApiRequest();
        default:
          throw new Error(`API Error: ${errorData.message}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}
```

#### Error handling

```python
import requests
from time import sleep

def make_api_request():
    try:
        response = requests.get(
            'https://express-api.adobe.io/endpoint',
            headers={
                'Authorization': f'Bearer {token}',
                'x-request-id': request_id
            }
        )

        response.raise_for_status()
        return response.json()

    except requests.exceptions.HTTPError as e:
        error_data = e.response.json()

        if e.response.status_code == 401:
            # Handle authentication error
            refresh_token()
            return make_api_request()
        elif e.response.status_code == 429:
            # Handle rate limiting
            retry_after = int(e.response.headers.get('Retry-After', 60))
            sleep(retry_after)
            return make_api_request()
        else:
            raise Exception(f"API Error: {error_data.get('message')}")

    except Exception as e:
        print(f"Request failed: {str(e)}")
        raise
```

## Best Practices

### Error Handling

1. **Always Include Required Headers**

   - Authorization token
   - x-request-id for request tracking
   - Content-Type for POST/PUT requests

2. **Implement Retry Logic**

   - Use exponential backoff for rate limits
   - Handle token refresh automatically
   - Set maximum retry attempts

3. **Log Error Details**

   - Include error code and message
   - Log request ID for tracking
   - Record timestamp and context

4. **Validate Input**

   - Check required parameters
   - Validate data formats
   - Handle edge cases

### Security Considerations

1. **Token Management**

   - Store tokens securely
   - Refresh before expiration
   - Never log sensitive data

2. **Error Messages**

   - Don't expose internal details
   - Use generic messages for users
   - Log detailed errors server-side

## Troubleshooting Checklist

Before contacting support:

- [ ] Verify API credentials
- [ ] Check request format
- [ ] Validate input data
- [ ] Review rate limits
- [ ] Check service status
- [ ] Review recent changes
- [ ] Check logs for details
