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

V1 is the GA successor to the Beta API. Migrating is mostly a one-segment path change (`/beta/` to `/v1/`) plus a few request-payload renames. Authentication, the host, and every query and path parameter are unchanged.

V1 and Beta coexist during the transition: every `/beta/` endpoint stays callable (the V1 spec marks them `deprecated`), so you can migrate one call at a time. Beta will be removed after V1 is generally available, with advance notice, in the future.

## Before you start

Your existing credentials keep working. V1 uses the same host (`https://express-api.adobe.io`), the same `X-API-KEY` and `Authorization: Bearer` headers, and the same access scopes as Beta, so you do not need to re-issue tokens or touch your auth code. See [Create credentials](../getting-started/create-credentials/index.md) if you need a new project.

Rate limits are not part of this migration and are not defined in the API spec itself; do not hard-code an assumption about V1 throughput. See [Rate limits](../getting-started/rate-limits/index.md) for the current limits.

## What changes at a glance

- Change the first path segment from `/beta/` to `/v1/` on every endpoint, except `/status/{jobId}`, which is unversioned.
- Rewrite three request payloads: the document/template reference, the tag mappings, and the rendition options (each is a step below).
- `generate-variation` is deprecated in favour of `create-variation` and has no `/v1/` endpoint—move that workload to `create-variation`.

The field renames you will make:

| Beta                                                                      | V1                                          |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| `id` (bare string)                                                        | `templateOrDocument.creativeCloudFileId`    |
| `input.mappings` (grouped by type)                                        | `input.dataFieldMappings` (flat array)      |
| `tagName` (per mapping entry)                                             | `name`                                      |
| `options.format` (export-rendition)                                       | `options.mediaType`                         |
| `ImageRenditionOptions` • `PdfRenditionOptions` • `VideoRenditionOptions` | `ImageOutput` • `PdfOutput` • `VideoOutput` |

## Endpoint mapping

| Beta endpoint                             | V1 endpoint                                                                 | What to do                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /beta/tagged-documents`              | `GET /v1/tagged-documents`                                                  | Update path; read `templateOrDocument` in each entry                         |
| `GET /beta/tagged-documents/{documentId}` | `GET /v1/tagged-documents/{documentId}`                                     | Update path; read `templateOrDocument` in the response                       |
| `POST /beta/create-variation`             | `POST /v1/create-variation`                                                 | Update path; switch `mappings` to `dataFieldMappings`                        |
| `POST /beta/export-rendition`             | `POST /v1/export-rendition`                                                 | Update path; switch `id` to `templateOrDocument` and `format` to `mediaType` |
| `POST /beta/generate-variation`           | None (deprecated)                                                           | Move to `create-variation`, its successor                                    |
| `GET /status/{jobId}`                     | `GET /status/{jobId}`                                                       | No change                                                                    |
| None                                      | • `POST /v1/bulk-create-variation`\<br/>• `POST /v1/batch-create-variation` | New in V1 (see below)                                                        |

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

V1 replaces the bare `id` string with a structured `templateOrDocument` object wherever a document or template is referenced. This affects the `export-rendition` request body and the `tagged-documents` responses. (`create-variation` already used `templateOrDocument` in Beta, so it needs no change here.)

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

The same field appears in the `tagged-documents` responses: read `templateOrDocument.creativeCloudFileId` where you previously read `id`.

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

Set `type` to `image`, `pdf`, or `video` to match the media you are exporting.

## Replace Generate Variation with Create Variation

`generate-variation` is deprecated in favour of `create-variation` and does not get a `/v1/` endpoint. Build a `create-variation` request (`templateOrDocument`, `input.dataFieldMappings`, and the `outputs` you want) and poll `GET /status/{jobId}` as before. See [Create a Document Variation](./how-to/create-variation.md) for the full recipe.

## Handle the wider status response

Polling does not change. Submit a job, get a `jobId` (HTTP 202), and poll `GET /status/{jobId}` exactly as before; the endpoint is unversioned and its contract is unchanged. The only difference is that a V1 `create-variation` job can now return `document`, `pdf`, and `video` results in the `outputs` array, not just `image`. If your code only ever requested image outputs, its responses are unaffected. See the [API Reference](../api/index.md) {/_ TODO: repoint to V1 reference when published _/} for the full result union.

## New in V1

V1 adds two endpoints for generating many variations from a single template in one job—for high-volume, non-interactive workloads. Keep using `create-variation` for interactive, low-volume, user-facing generation; reach for these when you need backend, bulk output:

- `POST /v1/bulk-create-variation`—generates variations at scale from an external data source: a manifest (a pre-signed URL) pointing to NDJSON files whose rows each carry a `dataFieldMappings` set. Best for large, unbounded jobs.
- `POST /v1/batch-create-variation`—generates several variations from an inline request payload, with no manifest or file upload. Bounded: up to 30 variations per request (by default) and a 1 MB request body.

Both submit asynchronously and are polled through `GET /status/{jobId}` like every other job. Bulk and Batch Create Variation are being added to the [Create a Document Variation](./how-to/create-variation.md) guide; until that lands, see the [API Reference](../api/index.md) {/_ TODO: repoint to V1 reference when published _/} for their request shapes.

## Verify your migration

Work through each call your integration makes:

1. Confirm the path uses `/v1/`, except `/status/{jobId}`.
2. Confirm `create-variation` and `export-rendition` requests send `templateOrDocument` (not `id`), and `dataFieldMappings` / `mediaType` where they apply.
3. Send the request and confirm a `200` or `202` response.
4. Confirm the results you expect come back from `GET /status/{jobId}`.

## References

- [Adobe Express API Reference](../api/index.md) {/_ TODO: repoint to V1 reference when published _/}—the full request and response surface.
- [Create a Document Variation](./how-to/create-variation.md)—the `create-variation` recipe, and the successor to `generate-variation`.
- [Get Tagged Documents](./how-to/get-tagged-documents.md)—list your tagged documents and read `templateOrDocument`.
- [Rate limits](../getting-started/rate-limits/index.md)—current request limits.
