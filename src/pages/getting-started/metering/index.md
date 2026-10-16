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
contributors:
  - https://github.com/undavide
hideBreadcrumbNav: true
---

# Metering and credits

When you integrate with the Adobe Express API, credit usage depends on the operation and the work it performs. This guide explains which operations consume credits, their credit rates, and how metering differs from billing and request rate limits.

## Metering, billing, and rate limits

**Metering** tracks API usage, while **Billing** determines the charges for that usage. Metering may begin before billing is enabled, so recorded usage does not necessarily mean you are being charged.

The rate card measures usage in **Credits** based on units such as modified pages, output images, output pages, and documents. Credits are based on the work performed, not simply on the number of HTTP requests made.

**Rate limits** are separate from metering and billing. They control how many requests you can make and how frequently you can make them; they do not determine how many credits an operation consumes. See [Rate limits](../rate-limits/index.md) for request limits and capacity guidance.

## Credit rates

Credits are calculated based on the operation performed and, where applicable, the amount or type of output produced.

| Operation               | Component                                 | Credits | Unit              |
| ----------------------- | ----------------------------------------- | ------- | ----------------- |
| Create Variation        | Baseline                                  | 0.5     | Per modified page |
| Create Variation        | JPG or PNG output, additional to baseline | 0.5     | Per output image  |
| Create Variation        | PDF output, additional to baseline        | 2       | Per output page   |
| Export Rendition        | JPG or PNG output                         | 0.5     | Per output image  |
| Export Rendition        | PDF output                                | 2       | Per output page   |
| Tagged document details | Document metadata                         | 0.25    | Per document      |

For **Create Variation**, credits for modified pages and generated outputs are calculated separately and added together. For example, an operation that modifies two pages and produces two PNG images consumes credits for both the two modified pages and the two output images. PDF output is always charged per-page.

The rates apply to the following endpoints:

- `POST /v1/create-variation`: modifies a tagged template or document and generates outputs.
- `POST /v1/export-rendition`: exports pages from an existing document.
- `GET /v1/tagged-documents/{documentId}`: retrieves page and tagged-element details.

### Rate examples

The following examples show how credit rates apply to common operations.

| Example                              | Component         | Quantity | Rate | Credits    |
| ------------------------------------ | ----------------- | -------- | ---- | ---------- |
| **Create Variation with PNG output** | Modified pages    | 2        | 0.5  | 1          |
|                                      | PNG outputs       | 2        | 0.5  | 1          |
|                                      | **TOTAL**         |          |      | **(2)**    |
| **Create Variation with PDF output** | Modified pages    | 2        | 0.5  | 1          |
|                                      | PDF output pages  | 3        | 2    | 6          |
|                                      | **TOTAL**         |          |      | **(7)**    |
| **Export Rendition with JPG output** | JPG outputs       | 4        | 0.5  | 2          |
|                                      | **TOTAL**         |          |      | **(2)**    |
| **Get tagged document details**      | Document metadata | 1        | 0.25 | 0.25       |
|                                      | **TOTAL**         |          |      | **(0.25)** |

## Operations without credit charges

These operations do not consume credits:

| Operation                  | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `GET /v1/tagged-documents` | List the tagged documents you can access.                    |
| `GET /status/{jobId}`      | Check an asynchronous job's status and retrieve its results. |

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
