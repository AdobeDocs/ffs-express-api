---
title: Metering and credits
description: Understand which Adobe Express API operations consume credits and how usage relates to billing and rate limits.
keywords:
  - Adobe Express API
  - Metering
  - Credits
  - Rate card
  - Create Variation
  - Export Rendition
  - Tagged document details
contributors: []
hideBreadcrumbNav: true
---

# Metering and credits

When you integrate with the Adobe Express API, credit usage depends on the operation and the work it performs. This guide explains which operations consume credits, their credit rates, and how metering differs from billing and request rate limits.

## Metering, billing, and rate limits

**Metering** records API usage. **Billing** applies charges to that usage. Metering can begin before billing is enabled, so recording usage does not by itself mean that charges are active.

The rate card expresses usage in credits, with units such as modified pages, output images, output pages, and documents. It is not a flat charge for every HTTP request.

**Rate limits** control the volume and frequency of requests, not the number of credits an operation consumes. See [Rate limits](../rate-limits/index.md) for request limits and capacity guidance.

## Credit rates

`POST /v1/create-variation` modifies a tagged template or document and generates outputs. Its rate combines a baseline per modified page with an additional charge for the output. `POST /v1/export-rendition` exports pages from an existing document. `GET /v1/tagged-documents/{documentId}` retrieves page and tagged-element details.

The rate card distinguishes the following operations and charge components:

| Operation | Component | Credits | Unit |
| --- | --- | --- | --- |
| Export Rendition | JPG or PNG output | 0.5 | Per output image |
| Export Rendition | PDF output | 2 | Per output page |
| Create Variation | Baseline | 0.5 | Per modified page |
| Create Variation | JPG or PNG output, additional to baseline | 0.5 | Per output image |
| Create Variation | PDF output, additional to baseline | 2 | Per output page |
| Tagged document details | Document metadata | 0.25 | Per document |

For Create Variation, modified pages and rendered outputs are distinct charge components. PDF output uses a per-page rate, not a per-file rate.

## Operations without credit charges

These operations do not consume credits:

| Operation | Purpose |
| --- | --- |
| `GET /v1/tagged-documents` | List the tagged documents you can access. |
| `GET /status/{jobId}` | Check an asynchronous job's status and retrieve its results. |

Create Variation and Export Rendition run asynchronously and return a job to check through `GET /status/{jobId}`. Polling for status is separate from the metered work that generates the outputs.

## Related guides

- [Create Document Variations](../../guides/how-to/create-variation.md) explains request fields, output options, and page selection.
- [Migrate from Beta to V1](../../guides/migration-beta-to-v1.md) explains endpoint and payload changes for an existing integration.

## Billing FAQ

### Is each API request one credit?

No. Credit rates depend on the operation and its units of work, such as modified pages or output images, rather than a fixed one-credit-per-request rule.

### Does polling for job status consume credits?

No. Calls to `GET /status/{jobId}` do not consume credits.

### Is listing tagged documents charged like retrieving their details?

No. `GET /v1/tagged-documents` consumes no credits; tagged document details have a per-document rate in the rate card.

### Do credit rates replace request rate limits?

No. Request rate limits still apply; for higher capacity, contact your account manager or use the [Express API Rate Limit Increase Form](https://www.adobe.com/go/express-api-ratelimiting).
