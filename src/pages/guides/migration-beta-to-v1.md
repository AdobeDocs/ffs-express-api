---
title: Migrate from Beta to V1
description: Move your Adobe Express API integration from the Beta endpoints to the V1 GA endpoints, covering the path change and the request-payload renames.
keywords:
  - Adobe Express
  - Adobe Express API
  - Migration
  - Beta to V1
  - v1
  - create-variation
  - export-rendition
  - dataFieldMappings
  - templateOrDocument
contributors:
  - https://github.com/undavide
hideBreadcrumbNav: true
---

# Migrate from Beta to V1

Move your Adobe Express API integration from the `/beta/` endpoints to the generally available `/v1/` endpoints.

<InlineAlert variant="info" slots="heading, text" />

#### What's changing

V1 is the GA successor to the Beta API. Migrating is mostly a one-segment path change (`/beta/` to `/v1/`) plus a few request- and response-field renames. Authentication, the host, and every query and path parameter are unchanged.

V1 and Beta coexist during the transition: every `/beta/` endpoint stays callable (the V1 spec marks them `deprecated`), so you can migrate one call at a time. Beta will be removed after V1 is generally available, with advance notice, in the future.

## Before you start

Your existing credentials keep working. V1 uses the same host (`https://express-api.adobe.io`), the same `X-API-KEY` and `Authorization: Bearer` headers, and the same access scopes as Beta, so you do not need to re-issue tokens or touch your auth code. See [Create credentials](../getting-started/create-credentials/index.md) if you need a new project.

Rate limits are not part of this migration and are not defined in the API spec itself; do not hard-code an assumption about V1 throughput. See [Rate limits](../getting-started/rate-limits/index.md) for the current limits.

## What changes at a glance

- Change the first path segment from `/beta/` to `/v1/` on every endpoint, except `/status/{jobId}`, which is unversioned.
- Rewrite three request payloads: the document/template reference, the tag mappings, and the rendition options (each is a step below).
- Read `templateOrDocument.creativeCloudFileId` instead of `id` in V1 responses: the tagged-documents responses and the export-rendition job status.
- `generate-variation` is deprecated in favour of `create-variation` and has no `/v1/` endpoint—move that workload to `create-variation`.

The field renames you will make:

| Beta                                                                      | V1                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `id` (bare string)                                                        | `templateOrDocument.creativeCloudFileId`                      |
| `input.mappings` (grouped by type)                                        | `input.dataFieldMappings` (flat array)                        |
| `tagName` (per mapping entry)                                             | `name`                                                        |
| `options.format` (export-rendition)                                       | `options.type` + `options.mediaType` (PDF: `type: "pdf"` only) |
| `ImageRenditionOptions` • `PdfRenditionOptions` • `VideoRenditionOptions` | `ImageOutput` • `PdfOutput` • `VideoOutput`                   |
| `taggedElements` (tagged-documents detail response)                       | `dataFields`                                                  |
| `value` (per tagged text field)                                           | `text`                                                        |

## Endpoint mapping

| Beta endpoint                             | V1 endpoint                             | What to do                                                                                                                                       |
| ----------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /beta/tagged-documents`              | `GET /v1/tagged-documents`              | Update path; read `templateOrDocument` in each entry                                                                                             |
| `GET /beta/tagged-documents/{documentId}` | `GET /v1/tagged-documents/{documentId}` | Update path; read `templateOrDocument`; the element list is now `dataFields` (was `taggedElements`), each text field's value is `text` (was `value`) |
| `POST /beta/create-variation`             | `POST /v1/create-variation`             | Update path; switch `mappings` to `dataFieldMappings`                                                                                            |
| `POST /beta/export-rendition`             | `POST /v1/export-rendition`             | Update path; switch `id` to `templateOrDocument` and `format` to `type` + `mediaType`                                                            |
| `POST /beta/generate-variation`           | None (deprecated)                       | Move to `create-variation`, its successor                                                                                                        |
| `GET /status/{jobId}`                     | `GET /status/{jobId}`                   | Path unchanged; V1 export-rendition results carry `templateOrDocument` instead of `id`                                                           |

## Update the base path

Change the first path segment from `beta` to `v1` on every endpoint. The host stays `https://express-api.adobe.io`, and nothing else about the URL, including query and path parameters, changes.

<CodeBlock slots="heading, code" repeat="2" languages="HTTP, HTTP" />

#### Beta

```http
POST https://express-api.adobe.io/beta/create-variation
```

#### V1

```http
POST https://express-api.adobe.io/v1/create-variation
```

The one exception is `GET /status/{jobId}`, which has never carried a version segment and is unchanged.

## Update document and template references

V1 replaces the bare `id` string with a structured `templateOrDocument` object wherever a document or template is referenced. This affects the `export-rendition` request body, the `tagged-documents` responses, and the `export-rendition` job status. (`create-variation` already used `templateOrDocument` in Beta, so it needs no change here.)

In the `export-rendition` request body, replace the top-level `id` with a `templateOrDocument` object:

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Beta

```json
{
  "id": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
}
```

#### V1

```json
{
  "templateOrDocument": {
    "creativeCloudFileId": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
  }
}
```

The same field appears in the `tagged-documents` responses and in the V1 `export-rendition` job status: read `templateOrDocument.creativeCloudFileId` where you previously read `id` (see [Read export results from the status response](#read-export-results-from-the-status-response)).

In the tagged-document detail response (`GET /v1/tagged-documents/{documentId}`), the per-page `taggedElements` array is also renamed to `dataFields`, and each text field's `value` becomes `text`. Image and video fields carry no value.

## Update tag mappings

`create-variation` replaces the grouped `input.mappings` object with a single flat `input.dataFieldMappings` array. Three things change together: the object of typed sub-arrays becomes one array, each entry's `tagName` becomes `name`, and each entry gains a required `type` of `text`, `image`, or `video`.

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Beta

```json
{
  "input": {
    "mappings": {
      "textMappings": [{ "tagName": "headline", "text": "Summer Sale" }],
      "imageMappings": [
        {
          "tagName": "heroImage",
          "source": {
            "url": "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg"
          }
        }
      ]
    }
  }
}
```

#### V1

```json
{
  "input": {
    "dataFieldMappings": [
      { "name": "headline", "type": "text", "text": "Summer Sale" },
      {
        "name": "heroImage",
        "type": "image",
        "source": {
          "url": "https://my-bucket.s3.us-east-2.amazonaws.com/hero.jpg"
        }
      }
    ]
  }
}
```

The same restructure applies inside each `pageOverrides` entry. See [Create a Document Variation](./how-to/create-variation.md) for the full request.

## Update rendition options

In the `export-rendition` request, the `options` object gains a `type` discriminator and renames `format` to `mediaType`, aligning it with the output schema `create-variation` already uses.

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Beta

```json
{
  "options": {
    "format": "image/png",
    "size": 1024
  }
}
```

#### V1

```json
{
  "options": {
    "type": "image",
    "mediaType": "image/png",
    "size": 1024
  }
}
```

Set `type` to `image`, `pdf`, or `video` to match the media you are exporting. Image and video outputs keep their MIME type in `mediaType` (`video/mp4` for video). PDF output has no `mediaType`: replace `"format": "application/pdf"` with `"type": "pdf"`, and keep `pdfType`, `downloadIndividualPdfFiles`, and `config` as they were.

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Beta

```json
{
  "options": {
    "format": "application/pdf",
    "pdfType": "standard"
  }
}
```

#### V1

```json
{
  "options": {
    "type": "pdf",
    "pdfType": "standard"
  }
}
```

V1 output options can also carry their own `pages` string. If you set both the top-level `pages` and `options.pages`, `options.pages` takes precedence.

## Replace Generate Variation with Create Variation

`generate-variation` is deprecated in favour of `create-variation` and does not get a `/v1/` endpoint. Build a `create-variation` request (`templateOrDocument`, `input.dataFieldMappings`, and the `outputs` you want) and poll `GET /status/{jobId}` as before. See [Create a Document Variation](./how-to/create-variation.md) for the full recipe.

## Read export results from the status response

Polling does not change. Submit a job, get a `jobId` (HTTP 202), and poll `GET /status/{jobId}` exactly as before; the endpoint is unversioned. Create Variation status responses have the same shape for Beta and V1 jobs.

V1 `export-rendition` jobs return the same `jobId`, `status`, and `pageRenditionsResult` fields as Beta, but the top-level document identifier is now a `templateOrDocument` object instead of a bare `id`:

<CodeBlock slots="heading, code" repeat="2" languages="JSON, JSON" />

#### Beta

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "status": "succeeded",
  "id": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae",
  "pageRenditionsResult": [
    { "pageNumber": 1, "renditionUrl": "https://example.com/rendition/page1.png" }
  ]
}
```

#### V1

```json
{
  "jobId": "af121560-218e-4dd9-918d-add12b3b6d98",
  "status": "succeeded",
  "templateOrDocument": {
    "creativeCloudFileId": "urn:aaid:sc:VA6C2:82d42ecf-8ce8-310b-b976-6f104a0d4fae"
  },
  "pageRenditionsResult": [
    { "pageNumber": 1, "renditionUrl": "https://example.com/rendition/page1.png" }
  ]
}
```

See the [API Reference](../api/index.md) {/* TODO: repoint to V1 reference when published */} for the full result union.

## Verify your migration

Work through each call your integration makes:

1. Confirm the path uses `/v1/`, except `/status/{jobId}`.
2. Confirm `create-variation` and `export-rendition` requests send `templateOrDocument` (not `id`), and `dataFieldMappings` / `type` + `mediaType` where they apply.
3. Confirm your code reads `templateOrDocument.creativeCloudFileId` (not `id`) from tagged-documents and export-rendition responses.
4. Send the request and confirm a `200` or `202` response.
5. Confirm the results you expect come back from `GET /status/{jobId}`.

## References

- [Adobe Express API Reference](../api/index.md) {/* TODO: repoint to V1 reference when published */}—the full request and response surface.
- [Create a Document Variation](./how-to/create-variation.md)—the `create-variation` recipe, and the successor to `generate-variation`.
- [Get Tagged Documents](./how-to/get-tagged-documents.md)—list your tagged documents and read `templateOrDocument`.
- [Rate limits](../getting-started/rate-limits/index.md)—current request limits.
