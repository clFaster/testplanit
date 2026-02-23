---
title: Markdown Import
---

# AI-Assisted Markdown Import

When importing test cases from markdown files, TestPlanIt can use your configured LLM integration to intelligently parse and extract structured test case data from various markdown formats.

## Import Workflow

1. Navigate to the **Import Test Cases** wizard in your project repository
2. Select a markdown file (`.md`, `.markdown`, or `.txt`)
3. If an LLM integration is configured, a checkbox appears: **"Use AI to assist with field mapping"**
4. When enabled, the AI analyzes your markdown content and extracts structured data including:
   - Test case names and descriptions
   - Steps with expected results
   - Preconditions
   - Tags
   - Custom field values
5. Extracted fields are automatically mapped to your template fields in the mapping step
6. Review the parsed test cases in the preview step before importing

## Fallback Behavior

If AI parsing is unavailable or fails, the system automatically falls back to a deterministic parser that auto-detects three markdown formats:

- **Table-based** — Markdown tables with recognizable column headers
- **Heading-based** — Each heading represents a separate test case with sub-sections
- **Single case** — Unstructured markdown treated as one test case

## Requirements

- Project must have an active LLM integration configured
- Without an LLM integration, the AI parsing checkbox is hidden and the standard parser is used automatically
