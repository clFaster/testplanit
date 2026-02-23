---
title: Screenshot Uploads
---

# Screenshot Uploads

The reporter can upload screenshots to TestPlanIt when `uploadScreenshots` is enabled (the default). However, **the reporter does not automatically capture screenshots** - it intercepts screenshots taken by your WebdriverIO configuration and uploads them.

## Using the Launcher Service (recommended)

If you're using the [Launcher Service](./wdio-launcher-service.md), set `captureScreenshots: true` on the service. It handles the `afterTest` hook for you — no extra configuration needed:

```javascript
// wdio.conf.js
import { TestPlanItService } from '@testplanit/wdio-reporter';

export const config = {
  services: [
    [TestPlanItService, {
      domain: 'https://testplanit.example.com',
      apiToken: process.env.TESTPLANIT_API_TOKEN,
      projectId: 1,
      captureScreenshots: true, // Automatically capture screenshots on failure
    }]
  ],
  reporters: [
    ['@testplanit/wdio-reporter', {
      domain: 'https://testplanit.example.com',
      apiToken: process.env.TESTPLANIT_API_TOKEN,
      projectId: 1,
      uploadScreenshots: true, // Upload captured screenshots (default)
    }]
  ],
};
```

## Using the afterTest hook manually

Without the launcher service, configure WebdriverIO to capture screenshots on failure using the `afterTest` hook:

```javascript
// wdio.conf.js
export const config = {
  afterTest: async function(test, context, { error, result, duration, passed }) {
    if (!passed) {
      // Take a screenshot - the reporter will intercept and upload it
      await browser.takeScreenshot();
    }
  },
  reporters: [
    ['@testplanit/wdio-reporter', {
      domain: 'https://testplanit.example.com',
      apiToken: process.env.TESTPLANIT_API_TOKEN,
      projectId: 1,
      uploadScreenshots: true, // Upload intercepted screenshots to TestPlanIt
    }]
  ],
};
```

## How it works

1. A screenshot is captured when a test fails (either by the service or your `afterTest` hook)
2. The reporter intercepts the screenshot data from the WebdriverIO command
3. When the test result is reported, the screenshot is uploaded as an attachment

**Note:** Using `browser.saveScreenshot('./path/to/file.png')` also works - the reporter intercepts the screenshot data before it's saved to disk.
