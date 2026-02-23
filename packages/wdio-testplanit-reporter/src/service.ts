/**
 * WebdriverIO Launcher Service for TestPlanIt.
 *
 * Manages the test run lifecycle in the main WDIO process:
 * - onPrepare: Creates the test run and JUnit test suite ONCE before any workers start
 * - onComplete: Completes the test run ONCE after all workers finish
 *
 * This ensures all spec files across all worker batches report to a single test run,
 * regardless of `maxInstances` or execution order.
 *
 * @example
 * ```javascript
 * // wdio.conf.js
 * import { TestPlanItService } from '@testplanit/wdio-reporter';
 *
 * export const config = {
 *   services: [
 *     [TestPlanItService, {
 *       domain: 'https://testplanit.example.com',
 *       apiToken: process.env.TESTPLANIT_API_TOKEN,
 *       projectId: 1,
 *       runName: 'E2E Tests - {date}',
 *     }]
 *   ],
 *   reporters: [
 *     ['@testplanit/wdio-reporter', {
 *       domain: 'https://testplanit.example.com',
 *       apiToken: process.env.TESTPLANIT_API_TOKEN,
 *       projectId: 1,
 *       autoCreateTestCases: true,
 *       parentFolderId: 10,
 *       templateId: 1,
 *     }]
 *   ]
 * }
 * ```
 *
 * @packageDocumentation
 */

import { TestPlanItClient } from '@testplanit/api';
import type { TestPlanItServiceOptions } from './types.js';
import {
  writeSharedState,
  deleteSharedState,
  type SharedState,
} from './shared.js';

/**
 * WebdriverIO Launcher Service for TestPlanIt.
 *
 * Creates a single test run before any workers start and completes it
 * after all workers finish. Workers read the shared state file to find
 * the pre-created test run and report results to it.
 */
export default class TestPlanItService {
  private options: TestPlanItServiceOptions;
  private client: TestPlanItClient;
  private verbose: boolean;
  private testRunId?: number;
  private testSuiteId?: number;

  constructor(serviceOptions: TestPlanItServiceOptions) {
    // Validate required options
    if (!serviceOptions.domain) {
      throw new Error('TestPlanIt service: domain is required');
    }
    if (!serviceOptions.apiToken) {
      throw new Error('TestPlanIt service: apiToken is required');
    }
    if (!serviceOptions.projectId) {
      throw new Error('TestPlanIt service: projectId is required');
    }

    this.options = {
      completeRunOnFinish: true,
      runName: 'Automated Tests - {date} {time}',
      testRunType: 'MOCHA',
      timeout: 30000,
      maxRetries: 3,
      verbose: false,
      ...serviceOptions,
    };

    this.verbose = this.options.verbose ?? false;

    this.client = new TestPlanItClient({
      baseUrl: this.options.domain,
      apiToken: this.options.apiToken,
      timeout: this.options.timeout,
      maxRetries: this.options.maxRetries,
    });
  }

  /**
   * Log a message if verbose mode is enabled
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(`[TestPlanIt Service] ${message}`, ...args);
    }
  }

  /**
   * Log an error (always logs, not just in verbose mode)
   */
  private logError(message: string, error?: unknown): void {
    const errorMsg = error instanceof Error ? error.message : String(error ?? '');
    console.error(`[TestPlanIt Service] ERROR: ${message}`, errorMsg);
  }

  /**
   * Format run name with available placeholders.
   * Note: {browser}, {spec}, and {suite} are NOT available in the service context
   * since it runs before any workers start.
   */
  private formatRunName(template: string): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const platform = process.platform;

    return template
      .replace('{date}', date)
      .replace('{time}', time)
      .replace('{platform}', platform)
      .replace('{browser}', 'unknown')
      .replace('{spec}', 'unknown')
      .replace('{suite}', 'Tests');
  }

  /**
   * Resolve string option IDs to numeric IDs using the API client.
   */
  private async resolveIds(): Promise<{
    configId?: number;
    milestoneId?: number;
    stateId?: number;
    tagIds?: number[];
  }> {
    const projectId = this.options.projectId;
    const resolved: {
      configId?: number;
      milestoneId?: number;
      stateId?: number;
      tagIds?: number[];
    } = {};

    if (typeof this.options.configId === 'string') {
      const config = await this.client.findConfigurationByName(projectId, this.options.configId);
      if (!config) {
        throw new Error(`Configuration not found: "${this.options.configId}"`);
      }
      resolved.configId = config.id;
      this.log(`Resolved configuration "${this.options.configId}" -> ${config.id}`);
    } else if (typeof this.options.configId === 'number') {
      resolved.configId = this.options.configId;
    }

    if (typeof this.options.milestoneId === 'string') {
      const milestone = await this.client.findMilestoneByName(projectId, this.options.milestoneId);
      if (!milestone) {
        throw new Error(`Milestone not found: "${this.options.milestoneId}"`);
      }
      resolved.milestoneId = milestone.id;
      this.log(`Resolved milestone "${this.options.milestoneId}" -> ${milestone.id}`);
    } else if (typeof this.options.milestoneId === 'number') {
      resolved.milestoneId = this.options.milestoneId;
    }

    if (typeof this.options.stateId === 'string') {
      const state = await this.client.findWorkflowStateByName(projectId, this.options.stateId);
      if (!state) {
        throw new Error(`Workflow state not found: "${this.options.stateId}"`);
      }
      resolved.stateId = state.id;
      this.log(`Resolved workflow state "${this.options.stateId}" -> ${state.id}`);
    } else if (typeof this.options.stateId === 'number') {
      resolved.stateId = this.options.stateId;
    }

    if (this.options.tagIds && this.options.tagIds.length > 0) {
      resolved.tagIds = await this.client.resolveTagIds(projectId, this.options.tagIds);
      this.log(`Resolved tags: ${resolved.tagIds.join(', ')}`);
    }

    return resolved;
  }

  /**
   * onPrepare - Runs once in the main process before any workers start.
   *
   * Creates the test run and JUnit test suite, then writes shared state
   * so all worker reporters can find and use the pre-created run.
   */
  async onPrepare(): Promise<void> {
    this.log('Preparing test run...');
    this.log(`  Domain: ${this.options.domain}`);
    this.log(`  Project ID: ${this.options.projectId}`);

    try {
      // Clean up any stale shared state from a previous run
      deleteSharedState(this.options.projectId);

      // Resolve string IDs to numeric IDs
      const resolved = await this.resolveIds();

      // Format the run name
      const runName = this.formatRunName(this.options.runName ?? 'Automated Tests - {date} {time}');

      // Create the test run
      this.log(`Creating test run: "${runName}" (type: ${this.options.testRunType})`);
      const testRun = await this.client.createTestRun({
        projectId: this.options.projectId,
        name: runName,
        testRunType: this.options.testRunType,
        configId: resolved.configId,
        milestoneId: resolved.milestoneId,
        stateId: resolved.stateId,
        tagIds: resolved.tagIds,
      });
      this.testRunId = testRun.id;
      this.log(`Created test run with ID: ${this.testRunId}`);

      // Create the JUnit test suite
      this.log('Creating JUnit test suite...');
      const testSuite = await this.client.createJUnitTestSuite({
        testRunId: this.testRunId,
        name: runName,
        time: 0,
        tests: 0,
        failures: 0,
        errors: 0,
        skipped: 0,
      });
      this.testSuiteId = testSuite.id;
      this.log(`Created JUnit test suite with ID: ${this.testSuiteId}`);

      // Write shared state file for workers to read
      const sharedState: SharedState = {
        testRunId: this.testRunId,
        testSuiteId: this.testSuiteId,
        createdAt: new Date().toISOString(),
        activeWorkers: 0, // Not used in service-managed mode
        managedByService: true,
      };
      writeSharedState(this.options.projectId, sharedState);
      this.log('Wrote shared state file for workers');

      // Always print this so users can see the run was created
      console.log(`[TestPlanIt Service] Test run created: "${runName}" (ID: ${this.testRunId})`);
    } catch (error) {
      this.logError('Failed to prepare test run:', error);
      // Clean up shared state on failure so reporters fall back to self-managed mode
      deleteSharedState(this.options.projectId);
      throw error;
    }
  }

  /**
   * afterTest - Runs in each worker process after each test.
   *
   * Captures a screenshot on test failure when `captureScreenshots` is enabled.
   * The screenshot is intercepted and uploaded by the reporter automatically.
   */
  async afterTest(
    _test: Record<string, unknown>,
    _context: Record<string, unknown>,
    result: { error?: Error; passed: boolean },
  ): Promise<void> {
    if (!this.options.captureScreenshots || result.passed) {
      return;
    }

    try {
      // `browser` is a WDIO global available in worker processes
      await (globalThis as Record<string, any>).browser?.takeScreenshot();
    } catch (error) {
      this.log('Failed to capture screenshot:', error);
    }
  }

  /**
   * onComplete - Runs once in the main process after all workers finish.
   *
   * Completes the test run and cleans up the shared state file.
   */
  async onComplete(exitCode: number): Promise<void> {
    this.log(`All workers finished (exit code: ${exitCode})`);

    try {
      if (this.testRunId && this.options.completeRunOnFinish) {
        this.log(`Completing test run ${this.testRunId}...`);
        await this.client.completeTestRun(this.testRunId, this.options.projectId);
        this.log('Test run completed successfully');
      }

      // Print summary
      if (this.testRunId) {
        console.log('\n[TestPlanIt Service] ══════════════════════════════════════════');
        console.log(`[TestPlanIt Service]   Test Run ID: ${this.testRunId}`);
        if (this.options.completeRunOnFinish) {
          console.log('[TestPlanIt Service]   Status: Completed');
        }
        console.log(`[TestPlanIt Service]   View: ${this.options.domain}/projects/runs/${this.options.projectId}/${this.testRunId}`);
        console.log('[TestPlanIt Service] ══════════════════════════════════════════\n');
      }
    } catch (error) {
      // Don't re-throw — failing onComplete would hide the actual test results
      this.logError('Failed to complete test run:', error);
    } finally {
      // Always clean up shared state
      deleteSharedState(this.options.projectId);
      this.log('Cleaned up shared state file');
    }
  }
}
