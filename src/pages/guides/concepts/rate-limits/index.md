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

## Summary of Rate Limits

Our API imposes the following rate limits **per organization**:

* **50** requests **per minute (RPM)**

## What to Do If You Run Into Issues

If you exceed the rate limits, you'll receive an **HTTP 429 Too Many Requests** error. If you encounter this error, consider any of the following solutions:

* Review your usage and reduce unnecessary requests.
* Implement retry logic via a [`retry-after` HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) or an [exponential backoff strategy](https://en.wikipedia.org/wiki/Exponential_backoff).
* Contact your account manager to request enabling higher usage rates.

## Why do API rate limits exist?

Rate limits are standard practice that serve several important purposes, including:

* Preventing abuse: Protects API from being overwhelmed by excessive requests.
* Protecting against downtime: Reduces the risk of service interruptions.
* Controlling costs: Helps manage resource consumption and associated expenses.
