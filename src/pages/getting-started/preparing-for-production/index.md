---
title: Preparing for production
description: Understand Adobe Express API capacity, template substitution limits, and workload planning before a large-scale production deployment.
keywords:
  - Adobe Express API
  - Production readiness
  - Rate limits
  - Processing capacity
  - Work queues
  - Template substitution limits
contributors:
  - https://github.com/undavide
hideBreadcrumbNav: true
---

# Preparing for production

Before you deploy an Adobe Express API integration at scale, plan for both request rates and the work those requests generate. This guide explains the capacity model, template substitution limits, and how to discuss your production workload with Adobe.

## From self-service access to production scale

Access is self-service through the Adobe Developer Console; see [Create credentials](../create-credentials/index.md). Initial limits are **intentionally conservative** and **designed for evaluation and testing**.

Test your integration first and validate its workflow and outputs. Before large-scale deployment, discuss your expected usage and capacity requirements with Adobe as part of launch planning—capacity increases are managed collaboratively.

## Rate limits, processing capacity, and queues

The number of requests you send and the generation work they create are separate constraints:

| Concept                      | What it means                                                     | Production consideration                                                                    |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| API rate limits              | How many requests you can make and how frequently.                | See [Rate Limits](../rate-limits/index.md) for current values and endpoint-specific limits. |
| Work queues                  | Generation work waiting for processing.                           | Excess demand may queue rather than fail immediately, so jobs can take longer to finish.    |
| Capacity escalation requests | Discussions with Adobe about higher limits and workload capacity. | Plan capacity changes with Adobe before large-scale deployment.                             |

Create Variation and Export Rendition run asynchronously. Track completion by [polling `GET /status/{jobId}`](../../guides/how-to/create-variation.md#poll-the-job) or through [webhook notifications](../../guides/how-to/handle-webhook-events-api.md#overview); a submitted job does not mean its outputs are ready. Request counts also differ from credit usage: credits measure the work an operation performs. See [Metering and credits](../metering/index.md) for how operations consume credits.

<InlineAlert variant="warning" slots="text" />

Repeated API overuse can return **HTTP 429 Too Many Requests**. See [Rate Limits troubleshooting](../rate-limits/index.md#troubleshooting) for guidance on `Retry-After` and exponential backoff.

## Template substitution limits

Plan your templates around these default substitution limits, and discuss capacity requirements with Adobe if you anticipate higher usage:

| Replacement type | Limit                                                 |
| ---------------- | ----------------------------------------------------- |
| Images           | 10 image substitutions per template.                  |
| Text             | Unlimited text replacements.                          |
| Video            | 2 video replacements per template; 250 MB size limit. |

These are _substitution_ limits, not _request-rate_ limits. For the mapping fields, see [Replace text, images, and videos](../../guides/how-to/create-variation.md#replace-text-images-and-videos). Limits can change over time.

## Production workload discussions

Before large-scale deployment, contact your account manager or use the [Express API Rate Limit Increase Form](https://www.adobe.com/go/express-api-ratelimiting) to discuss your expected usage and capacity needs.

Useful details to share include your expected request volume, peak demand, output formats (especially PDF), and launch timing. Include what you learned from testing, such as processing times and errors. Some limits may be configurable for your organization as part of capacity-planning discussions with Adobe.

## Related guides

- [Testing best practices](../support/best-practices/index.md#testing) covers test environments and unit tests.
- [Production usage FAQ](../support/FAQ/index.md#how-do-i-plan-for-production-usage) summarizes self-service access and production planning.
- [Support](../support/index.md) provides help with general integration questions and bug reports.
