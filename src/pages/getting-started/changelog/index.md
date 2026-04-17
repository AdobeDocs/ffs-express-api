---
title: Changelog - Adobe Express API
description: This is the changelog for Adobe Express API
keywords:
  - Express API
  - Developer documentation
  - API documentation
  - Integration
  - User interface components
  - Component library
  - UI/UX design
  - Web development
  - Application development
  - Software development kit (SDK)
  - JavaScript framework
  - Front-end development
  - Back-end development
  - Adobe Experience Platform
  - Cross-platform compatibility
  - Interactive experiences
  - User interface customization
  - API endpoints
  - Authentication and authorization
contributors:
  - https://github.com/nimithajalal
hideBreadcrumbNav: true
---

# Changelog

A list of updates to Adobe Express API.

## 2026-02-19

### Added

- **PDF Export Support**: Export renditions now include `application/pdf` format with standard and print options.
  - Added PDF-specific options for `pdfType`, `downloadIndividualPdfFiles`, and `config` (accessibility and print settings).
  - Updated Export Rendition documentation and guides to reflect PDF format support and page range usage.
  - Updated landing pages to list PDF among supported rendition formats.

## 2025-07-29

### Added

- **Comprehensive Video Capabilities**: Full video support across all Adobe Express API endpoints
  - Added `video` as a supported tag type in `TaggedElementType` schemas across all API specifications
  - Enhanced `RenditionFormat` to include `video/mp4` format alongside existing image formats
  - Added `VideoRenditionFormat` schema with MP4 support
  - Video renditions support sizes from 146px to 4096px with both upscaling and downscaling
  - Video rendition URLs are valid for 24 hours (vs 4 hours for images)

- **Enhanced Tag Mapping Support**: Video elements can now be mapped using pre-signed URLs in variation generation
  - Updated `tagMappings` descriptions to include video element support
  - Added video tag examples throughout documentation and code snippets

- **Updated Documentation**: Comprehensive updates to guides and tutorials
  - Enhanced [Generate Variations guide](../how-to/generate-variations.md) with video tag mapping examples
  - Updated [Export Document guide](../how-to/export-document.md) with video format constraints
  - Added video examples to [End-to-End Workflow guide](../how-to/end-to-end-workflow.md)
  - Updated FAQ and Known Issues sections with video tag mapping examples
  - Enhanced error logging documentation to include video format validation

- **API Specification Updates**: All OpenAPI specifications now include consistent video support

  - `alpha-generate-variation.json`: Video tag type and mapping support
  - `alpha-tagged-documents.json` and `alpha-tagged-documents-documentId.json`: Video tag type support
  - `alpha-export-rendition.json`: Already had comprehensive video support

### Technical Details

- Video renditions follow the same pre-signed URL requirements as images (AWS, Dropbox, Azure domains)
- Video tag mappings work seamlessly with existing text and image tag workflows
- All code examples and tutorials updated to demonstrate multi-media tag mapping capabilities

## 2025-04-30

### Added

- MP4 format support for the Export Rendition API. You can now export video renditions for pages containing timelines.
- See the [Export Rendition API documentation](../../api/index.md) for more details on supported formats and usage.

## 2025-03-21

### Added

We're excited to announce the release of our Express API

The Express API currently has 5 API endpoints briefly described below:

- [**Tagged documents API**](../../api/index.md): Retrieve all tagged documents accessible to the user.
- [**Tagged document details API**](../../api/index.md): Retrieve the details of a tagged document.
- [**Generate variation API**](../../api/index.md): Generate variations using a tagged document.
- [**Export rendition API**](../../api/index.md): Export a PNG image rendition of a tagged document.
- [**Status API**](../../api/index.md): Retrieve the status of a job (e.g., the job returned in the response from the generate variation or export rendition API).
