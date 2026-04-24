---
title: Rate Limits - Express API
description: This guide explains rate limiting for the Express API.
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
hideBreadcrumbNav: true
---
# Rate Limits

Express API places default rate limits on the volume and frequency of API calls. Contact your account manager to request higher rate limits if needed.

## Why do API rate limits exist?

Rate limits are standard practice that serve several important purposes, including:

* Preventing abuse: Protects API from being overwhelmed by excessive requests.
* Protecting against downtime: Reduces the risk of service interruptions.
* Controlling costs: Helps manage resource consumption and associated expenses.

## Summary of rate limits

Our API uses rate limits to ensure stability of the service. When you reach the rate limit, you'll receive HTTP 429 in response to your API request. You should implement logic that detects this and retries the calls at a later time.

Current rate limit (except as noted below):

**50** requests per minute (RPM)

<InlineAlert variant="info" slots="text" />

If your workflow needs a higher rate limit, please reach out to your account manager to request a higher rate limit or fill out this form(link/tbd).

### Export Rendition endpoint

The [Export Rendition API](../../api/index.md) has an additional per-client limit:

* **5** invocations **per minute** per `client-id`

This limit applies to the `/beta/export-rendition` route as a whole. Because rate limiting is enforced at the API route level, **image, PDF, and video export requests all share the same 5-per-minute budget** — they are not counted separately by format.

If you need to export multiple formats or higher volumes, either space requests out across the minute or contact your account manager to request a higher limit.

## Troubleshooting

If you exceed the rate limits, you'll receive an **HTTP 429 Too Many Requests** error. If you encounter this error, consider any of the following solutions:

* Review your usage and reduce unnecessary requests.
* Implement retry logic via a [`retry-after` HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) or an [exponential backoff strategy](https://en.wikipedia.org/wiki/Exponential_backoff).
* Contact your account manager to request enabling higher usage rates.
