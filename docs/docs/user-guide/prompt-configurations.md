---
sidebar_label: 'Prompt Configurations'
title: 'Prompt Configurations'
---

# Prompt Configurations

Prompt Configurations allow administrators to customize the AI prompts used across TestPlanIt's LLM-powered features. By defining different prompt configurations, you can fine-tune how AI generates test cases, parses markdown imports, selects test cases, and assists with writing.

## Overview

Each prompt configuration contains prompts for the following AI features:

- **Test Case Generation** — Controls how AI generates test cases from requirements and documents
- **Markdown Test Case Parsing** — Controls how AI maps markdown content to test case fields during import
- **Smart Test Case Selection** — Controls how AI selects relevant test cases when building test runs
- **Editor Writing Assistant** — Controls how AI assists with writing and improving content in rich text editors
- **LLM Connection Test** — A simple prompt used to verify the AI provider connection is working

## Prompt Resolution

When an AI feature is invoked, TestPlanIt resolves which prompt to use in the following order:

1. **Project-specific** — If the project has a prompt configuration assigned, that configuration's prompt is used
2. **System default** — If no project-specific configuration exists, the system default prompt configuration is used
3. **Hard-coded fallback** — If no database configurations exist, built-in fallback prompts are used as a safety net

This resolution chain ensures AI features always work, even before any prompt configurations are created.

## Managing Prompt Configurations

### Accessing the Page

Navigate to **Administration** → **Prompt Configurations** in the admin menu (under the **Tools & Integrations** section).

### Creating a Configuration

1. Click the **Add Prompt Configuration** button
2. Fill in the configuration details:
   - **Name** — A unique name for this configuration (required)
   - **Description** — Optional description of the configuration's purpose
   - **Is Default** — Whether this should be the system-wide default configuration
   - **Is Active** — Whether this configuration is available for use
3. Configure prompts for each feature using the accordion sections:
   - **System Prompt** — Instructions that set the AI's behavior and context (required)
   - **User Prompt** — The template sent with each request, supporting `{{variable}}` placeholders
   - **Temperature** — Controls randomness (0 = deterministic, 2 = most creative, default: 0.7)
   - **Max Output Tokens** — Maximum length of AI responses (default: 2048)
4. Click **Save** to create the configuration

Default prompts are pre-filled for each feature when creating a new configuration.

### Editing a Configuration

Click the edit icon on any configuration row to modify its settings. All fields can be updated, including individual feature prompts.

### Setting a Default

Use the **Default** toggle in the table to set a configuration as the system default. Only one configuration can be the default at a time. Setting a new default automatically:

- Removes the default flag from the previous default
- Forces the new default to be active

The default configuration cannot be deleted.

### Deleting a Configuration

Click the delete icon to remove a configuration. Deletion is a soft delete — the configuration is marked as deleted but retained in the database. Any projects using a deleted configuration will fall back to the system default.

## Project Assignment

Prompt configurations can be assigned to individual projects:

1. Go to **Project Settings** → **AI Models**
2. In the **Prompt Configuration** section, select the desired configuration from the dropdown
3. Choose **Use system default** to inherit the system default, or select a specific configuration

This allows different projects to use different AI behaviors — for example, a security-focused project might use prompts that emphasize security test scenarios.

## Prompt Variables

User prompts can include `{{variable}}` placeholders that are replaced at runtime with actual values. The available variables depend on the feature:

| Feature | Common Variables |
|---------|-----------------|
| Test Case Generation | `{{sourceContent}}`, `{{fields}}`, `{{numberOfCases}}` |
| Markdown Parsing | `{{markdownContent}}`, `{{fields}}` |
| Smart Test Case Selection | `{{testCases}}`, `{{context}}` |
| Editor Writing Assistant | `{{content}}`, `{{instruction}}` |

## Best Practices

- **Start with defaults** — The built-in prompts are well-tested. Create custom configurations only when you need specific behavior.
- **Test before deploying** — After creating a new configuration, assign it to a test project first to verify the AI output quality.
- **Use descriptive names** — Name configurations based on their purpose (e.g., "Security Testing Focus", "API Testing Optimized").
- **Keep one default** — Always maintain a system default configuration as a reliable fallback.
- **Document your changes** — Use the description field to explain what makes each configuration different from the default.
