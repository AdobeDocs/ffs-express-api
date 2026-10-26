---
title: Overview - Adobe Express API
description: This is the overview page of Adobe Express API
contributors:
  - https://github.com/nimithajalal
  - https://github.com/hollyschinsky
  - https://github.com/undavide
---

<Superhero slots="heading, text" background="rgb(111, 46, 135)"/>

# Adobe Express API

Effortlessly create and customize mixed-media designs with on-brand precision.

&lt;br/ &gt;

<Announcement slots="heading, text" className="request-access-announcement" variant="secondary" borderColor="#c148ed" hasborder="true" />

### The Adobe Express API is now Generally Available!

**We'd like to thank all the developers who participated in the beta program!**  
Your feedback has been invaluable in helping us refine the APIs,  
improve the developer experience, and shape the product for the V1 release.

If you've been using the beta APIs, we encourage you to check out our [Beta to V1 Migration Guide](./guides/migration-beta-to-v1.md) to learn about the changes and ensure a smooth transition to the latest version.

If you're interested in using the Adobe Express APIs in production for new projects or integrations, **we'd love to hear from you!** Get in touch with our team to discuss your use case and explore how we can support your use case.

- [Contact us](https://airtable.com/appu5RTWgdM95jynx/pagyuT1qspNJcPU2E/form)

&lt;br/ &gt;

<Resources slots="text, links"/>

**Useful Resources**

- [Express API Quickstart](guides/index.md)

## What is the Adobe Express API?

The Adobe Express API provides an effortless way to incorporate Adobe Express functionalities into your applications through a straightforward REST-based API. This documentation guides you through the initial steps, best practices, and current known issues/limitations.

## What can Express API do?

The Adobe Express (beta) API offers the following key features:

### Get Details of a Tagged Document

The Tagged Document Details API retrieves comprehensive information about pages and tagged elements within a specified document. The API returns a paginated list of document pages, along with metadata about each page, including title, size, and associated tagged elements. Each tagged element includes details such as size and position. The response includes pagination information for easy navigation through document pages.

### Get All Tagged Documents

The Tagged Documents API retrieves a list of all tagged documents accessible to the user, including owned and shared documents, along with their metadata. The API supports pagination and sorting options, allowing you to specify the starting point, number of documents to return, and sorting order. The response includes the requested documents and their associated metadata.

### Create Variation

The Create Variation API enables you to create document variations based on provided input parameters. The document can be exported on-the-fly, or stored temporarily, and remains available in your designated folder for 30 days, after which it is automatically removed. The API ensures proper document creation and accessibility within your directory.

### Export Rendition

The Export Rendition API enables document export in various supported formats (currently JPG, PNG, MP4, and PDF). The API provides pre-signed URLs for each page's rendition, valid for a format-specific duration. Image renditions are available in various sizes up to 8192px, while video renditions can be generated for pages containing a timeline up to a size of 4096px. PDF exports support standard and print outputs with optional accessibility and print settings. Track your export request progress through the provided status URL.

## Discover

<DiscoverBlock width="100%" slots="heading, link, text"/>

### Get Started

[Quickstart Guide](guides/index.md)

Get started with the Adobe Express API.

<DiscoverBlock slots="heading, link, text"/>

### Guides

[Authentication](getting-started/index.md)

Learn how to authenticate your requests.

<DiscoverBlock slots="link, text"/>

[Rate limiting](getting-started/rate-limits/index.md)

Learn about rate limiting.

<DiscoverBlock slots="link, text"/>

[Create Credentials](getting-started/create-credentials/index.md)

Learn how to create credentials for your services — Admin only.

<DiscoverBlock width="100%" slots="heading, link, text"/>

### API Reference

[Try the API](api/index.md)

Try the Adobe Express API. Explore, make calls, with full endpoint descriptions.
