---
title: Rate Limits - Express API
description: Learn how request rate limits, usage limits, and credit metering work in the Adobe Express API, including HTTP 429 responses and how to request higher limits.
keywords:
  - Adobe Express API
  - Rate limits
  - Adobe Express API
  - Developer documentation
  - Rate limiting concepts
  - API usage limits
  - Throttling
  - Rate limiting policies
  - Quotas
  - Request limits
  - API rate limiting strategies
  - Rate limit enforcement
  - Rate limit management
  - Usage quotas
  - Usage limits
  - Credit metering
  - Credits
  - Rate limit headers
  - Rate limit monitoring
  - Scalability considerations
  - Performance optimization
  - Rate limiting configurations
  - Rate limit exceptions
  - Client access
  - Concurrency
  - Monitors usage
  - API Usage
  - API performance
contributors:
  - https://github.com/nimithajalal
  - https://github.com/undavide
hideBreadcrumbNav: true
---

# Rate Limits

Express API places two kinds of default limits on API usage:

- **Request rate limits** control how many requests you can make to each endpoint per minute.
- **Usage limits** control how much your organization or account can use the [metered operations](#credit-metering).

## Why do API rate limits exist?

Rate limits are a standard practice that serves several important purposes, including:

- Preventing abuse: Protects API from being overwhelmed by excessive requests.
- Protecting against downtime: Reduces the risk of service interruptions.
- Controlling costs: Helps manage resource consumption and associated expenses.

## Request rate limits

Our API uses rate limits to ensure stability of the service. When you reach an endpoint's rate limit, you'll receive HTTP 429 in response to your API request. You should implement logic that detects this and retries the calls at a later time.

| Endpoint              | Requests per Minute (RPM) |
| --------------------- | ------------------------- |
| `/status`             | 1000                      |
| `v1/tagged-documents` | 25                        |
| `v1/create-variation` | 5                         |
| `v1/export-rendition` | 5                         |

Because rate limiting is enforced at the API route level, **image, PDF, and video export requests all share the same 5-per-minute budget**—they are not counted separately by format. If you need to export multiple formats or higher volumes, space requests out across the minute.

<InlineAlert variant="info" slots="heading, text" />

### How to request a higher Rate Limit

If you need additional capacity, contact your account manager to request a higher rate limit or fill out the [Express API Rate Limit Increase Form](https://www.adobe.com/go/express-api-ratelimiting).

## Usage limits

In addition to the request rate limits, the following [metered operations](#credit-metering) are subject to a usage limit. This limit applies to your organization or account as a whole, no matter which credentials (client IDs) send the requests.

- `POST /v1/create-variation`
- `POST /v1/export-rendition`
- `GET /v1/tagged-documents/{documentId}`

When your organization or account reaches its usage limit, the API rejects the request with an **HTTP 429 Too Many Requests** error. The API doesn't create a job, so there's no `jobId` to poll.

<InlineAlert variant="info" slots="heading, text" />

### How to request a higher usage limit

If you need more capacity, contact Adobe and describe your use case. Adobe reviews the request and can raise your limit.

## Credit metering

Credits measure the work an Express API operation performs, not the number of HTTP requests. Request rate limits are separate: they control request volume and frequency, not how many credits an operation consumes.

Metered work uses these operation-specific units:

| Metered operation | Work counted |
| --- | --- |
| Create Variation (`POST /v1/create-variation`) | Modified pages, plus JPG/PNG output images or PDF output pages. |
| Export Rendition (`POST /v1/export-rendition`) | JPG/PNG output images or PDF output pages. |
| Tagged-document details (`GET /v1/tagged-documents/{documentId}`) | Each document whose details you retrieve. |

For Create Variation, credits for modified pages and generated outputs are calculated separately and added together. For example, a request that modifies two pages and produces two PNG images consumes credits for both the two modified pages and the two output images. PDF output is counted per output page, not per PDF file.

Listing tagged documents (`GET /v1/tagged-documents`) and checking job status or retrieving results (`GET /status/{jobId}`) do not consume credits. Status polling is separate from the metered work that generates outputs.

For actual rates, see both HelpX rate cards:

- [Firefly Services and Firefly Creative Production operation rate card (Version A)](https://helpx.adobe.com/business/enterprise/products-entitlements/manage-entitlements/fireflyservices-ratecard-ver-a.html)
- [Firefly Services and Firefly Creative Production operations rate card (Legacy)](https://helpx.adobe.com/business/enterprise/products-entitlements/manage-entitlements/automation-operation-definition.html)

## Troubleshooting

Both request rate limits and usage limits return an **HTTP 429 Too Many Requests** error.

### Request rate limit exceeded

If you send more requests than an endpoint allows, consider any of the following solutions:

- Review your usage and reduce unnecessary requests.
- Implement retry logic via a [`retry-after` HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After) or an [exponential backoff strategy](https://en.wikipedia.org/wiki/Exponential_backoff).

### Usage limit reached

If a metered operation keeps returning HTTP 429 after you reduce your request rate and retry, your organization or account may have reached its usage limit. Consider any of the following solutions:

- Review usage across all the credentials in your organization or account, not just the one that received the error.
- Contact Adobe to [request a higher usage limit](#usage-limits).
