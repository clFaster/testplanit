import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the API client - must use class syntax for `new` to work
const mockClientInstance = {
  createTestRun: vi.fn().mockResolvedValue({ id: 100, name: 'Test Run' }),
  createJUnitTestSuite: vi.fn().mockResolvedValue({ id: 200, name: 'Test Suite' }),
  completeTestRun: vi.fn().mockResolvedValue({ id: 100, isCompleted: true }),
  findConfigurationByName: vi.fn().mockResolvedValue({ id: 10, name: 'Config' }),
  findMilestoneByName: vi.fn().mockResolvedValue({ id: 20, name: 'Milestone' }),
  findWorkflowStateByName: vi.fn().mockResolvedValue({ id: 30, name: 'State' }),
  resolveTagIds: vi.fn().mockResolvedValue([1, 2, 3]),
};

vi.mock('@testplanit/api', () => {
  return {
    TestPlanItClient: class MockTestPlanItClient {
      constructor() {
        return mockClientInstance;
      }
    },
  };
});

// Mock shared state utilities
vi.mock('./shared.js', () => ({
  writeSharedState: vi.fn(),
  deleteSharedState: vi.fn(),
  readSharedState: vi.fn().mockReturnValue(null),
}));

import TestPlanItService from './service.js';
import { writeSharedState, deleteSharedState } from './shared.js';

const mockedWriteSharedState = vi.mocked(writeSharedState);
const mockedDeleteSharedState = vi.mocked(deleteSharedState);

describe('TestPlanItService', () => {
  const defaultOptions = {
    domain: 'https://testplanit.example.com',
    apiToken: 'tpi_test_token',
    projectId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create service with valid options', () => {
      const service = new TestPlanItService(defaultOptions);
      expect(service).toBeDefined();
    });

    it('should throw if domain is missing', () => {
      expect(() => {
        new TestPlanItService({ ...defaultOptions, domain: '' });
      }).toThrow('domain is required');
    });

    it('should throw if apiToken is missing', () => {
      expect(() => {
        new TestPlanItService({ ...defaultOptions, apiToken: '' });
      }).toThrow('apiToken is required');
    });

    it('should throw if projectId is missing', () => {
      expect(() => {
        new TestPlanItService({ ...defaultOptions, projectId: 0 });
      }).toThrow('projectId is required');
    });

    it('should use default values for optional fields', () => {
      const service = new TestPlanItService(defaultOptions);
      // Just verify it doesn't throw — defaults are applied internally
      expect(service).toBeDefined();
    });
  });

  describe('onPrepare', () => {
    it('should create test run and JUnit test suite', async () => {
      const service = new TestPlanItService(defaultOptions);
      await service.onPrepare();

      // Should have called createTestRun and createJUnitTestSuite
      const clientInstance = mockClientInstance;
      expect(clientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 1,
        })
      );
      expect(clientInstance.createJUnitTestSuite).toHaveBeenCalledWith(
        expect.objectContaining({
          testRunId: 100,
        })
      );
    });

    it('should write shared state with managedByService: true', async () => {
      const service = new TestPlanItService(defaultOptions);
      await service.onPrepare();

      expect(mockedWriteSharedState).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          testRunId: 100,
          testSuiteId: 200,
          managedByService: true,
          activeWorkers: 0,
        })
      );
    });

    it('should clean up stale shared state before creating run', async () => {
      const service = new TestPlanItService(defaultOptions);
      await service.onPrepare();

      // deleteSharedState should be called before writeSharedState
      const deleteCallOrder = mockedDeleteSharedState.mock.invocationCallOrder[0];
      const writeCallOrder = mockedWriteSharedState.mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(writeCallOrder);
    });

    it('should resolve string configId', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        configId: 'My Config',
      });
      await service.onPrepare();

      const clientInstance = mockClientInstance;
      expect(clientInstance.findConfigurationByName).toHaveBeenCalledWith(1, 'My Config');
      expect(clientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          configId: 10,
        })
      );
    });

    it('should resolve string milestoneId', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        milestoneId: 'Sprint 1',
      });
      await service.onPrepare();

      const clientInstance = mockClientInstance;
      expect(clientInstance.findMilestoneByName).toHaveBeenCalledWith(1, 'Sprint 1');
      expect(clientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneId: 20,
        })
      );
    });

    it('should format run name with placeholders', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        runName: 'Tests - {date}',
      });
      await service.onPrepare();

      const clientInstance = mockClientInstance;
      const callArg = clientInstance.createTestRun.mock.calls[0][0];
      expect(callArg.name).toMatch(/Tests - \d{4}-\d{2}-\d{2}/);
    });

    it('should replace unavailable placeholders with fallbacks', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        runName: '{browser} - {spec} - {suite}',
      });
      await service.onPrepare();

      const clientInstance = mockClientInstance;
      const callArg = clientInstance.createTestRun.mock.calls[0][0];
      expect(callArg.name).toBe('unknown - unknown - Tests');
    });

    it('should throw when string configId is not found', async () => {
      mockClientInstance.findConfigurationByName.mockResolvedValueOnce(null);

      const service = new TestPlanItService({
        ...defaultOptions,
        configId: 'Nonexistent Config',
      });

      await expect(service.onPrepare()).rejects.toThrow('Configuration not found: "Nonexistent Config"');
    });

    it('should throw when string milestoneId is not found', async () => {
      mockClientInstance.findMilestoneByName.mockResolvedValueOnce(null);

      const service = new TestPlanItService({
        ...defaultOptions,
        milestoneId: 'Nonexistent Milestone',
      });

      await expect(service.onPrepare()).rejects.toThrow('Milestone not found: "Nonexistent Milestone"');
    });

    it('should throw when string stateId is not found', async () => {
      mockClientInstance.findWorkflowStateByName.mockResolvedValueOnce(null);

      const service = new TestPlanItService({
        ...defaultOptions,
        stateId: 'Nonexistent State',
      });

      await expect(service.onPrepare()).rejects.toThrow('Workflow state not found: "Nonexistent State"');
    });

    it('should resolve string stateId', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        stateId: 'In Progress',
      });
      await service.onPrepare();

      expect(mockClientInstance.findWorkflowStateByName).toHaveBeenCalledWith(1, 'In Progress');
      expect(mockClientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          stateId: 30,
        })
      );
    });

    it('should pass through numeric configId directly', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        configId: 42,
      });
      await service.onPrepare();

      expect(mockClientInstance.findConfigurationByName).not.toHaveBeenCalled();
      expect(mockClientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          configId: 42,
        })
      );
    });

    it('should pass through numeric milestoneId directly', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        milestoneId: 55,
      });
      await service.onPrepare();

      expect(mockClientInstance.findMilestoneByName).not.toHaveBeenCalled();
      expect(mockClientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneId: 55,
        })
      );
    });

    it('should pass through numeric stateId directly', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        stateId: 77,
      });
      await service.onPrepare();

      expect(mockClientInstance.findWorkflowStateByName).not.toHaveBeenCalled();
      expect(mockClientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          stateId: 77,
        })
      );
    });

    it('should resolve tagIds', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        tagIds: ['tag1', 'tag2'],
      });
      await service.onPrepare();

      expect(mockClientInstance.resolveTagIds).toHaveBeenCalledWith(1, ['tag1', 'tag2']);
      expect(mockClientInstance.createTestRun).toHaveBeenCalledWith(
        expect.objectContaining({
          tagIds: [1, 2, 3],
        })
      );
    });

    it('should not resolve tagIds when empty', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        tagIds: [],
      });
      await service.onPrepare();

      expect(mockClientInstance.resolveTagIds).not.toHaveBeenCalled();
    });

    it('should clean up shared state and re-throw on API failure', async () => {
      // Temporarily make createTestRun fail
      mockClientInstance.createTestRun.mockRejectedValueOnce(new Error('API error'));

      const service = new TestPlanItService(defaultOptions);

      await expect(service.onPrepare()).rejects.toThrow('API error');
      // deleteSharedState called twice: once at start (cleanup), once on error
      expect(mockedDeleteSharedState).toHaveBeenCalledTimes(2);
    });
  });

  describe('onComplete', () => {
    it('should complete test run when completeRunOnFinish is true', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        completeRunOnFinish: true,
      });
      await service.onPrepare();
      mockClientInstance.completeTestRun.mockClear();

      await service.onComplete(0);
      expect(mockClientInstance.completeTestRun).toHaveBeenCalledWith(100, 1);
    });

    it('should not complete test run when completeRunOnFinish is false', async () => {
      const service = new TestPlanItService({
        ...defaultOptions,
        completeRunOnFinish: false,
      });
      await service.onPrepare();
      mockClientInstance.completeTestRun.mockClear();

      await service.onComplete(0);
      expect(mockClientInstance.completeTestRun).not.toHaveBeenCalled();
    });

    it('should always delete shared state file', async () => {
      const service = new TestPlanItService(defaultOptions);
      await service.onPrepare();
      mockedDeleteSharedState.mockClear();

      await service.onComplete(0);
      expect(mockedDeleteSharedState).toHaveBeenCalledWith(1);
    });

    it('should not throw on API failure', async () => {
      const service = new TestPlanItService(defaultOptions);
      await service.onPrepare();

      mockClientInstance.completeTestRun.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(service.onComplete(0)).resolves.toBeUndefined();
    });

    it('should handle case where onPrepare was never called', async () => {
      const service = new TestPlanItService(defaultOptions);
      // No onPrepare call — testRunId is undefined
      await expect(service.onComplete(1)).resolves.toBeUndefined();
    });
  });

  describe('afterTest', () => {
    const mockTakeScreenshot = vi.fn().mockResolvedValue('base64data');

    beforeEach(() => {
      (globalThis as Record<string, any>).browser = { takeScreenshot: mockTakeScreenshot };
    });

    afterEach(() => {
      delete (globalThis as Record<string, any>).browser;
    });

    it('should capture screenshot on failure when captureScreenshots is enabled', async () => {
      const service = new TestPlanItService({ ...defaultOptions, captureScreenshots: true });
      await service.afterTest({}, {}, { passed: false });
      expect(mockTakeScreenshot).toHaveBeenCalled();
    });

    it('should not capture screenshot on pass', async () => {
      const service = new TestPlanItService({ ...defaultOptions, captureScreenshots: true });
      await service.afterTest({}, {}, { passed: true });
      expect(mockTakeScreenshot).not.toHaveBeenCalled();
    });

    it('should not capture screenshot when captureScreenshots is disabled', async () => {
      const service = new TestPlanItService(defaultOptions);
      await service.afterTest({}, {}, { passed: false });
      expect(mockTakeScreenshot).not.toHaveBeenCalled();
    });

    it('should not throw when screenshot capture fails', async () => {
      mockTakeScreenshot.mockRejectedValueOnce(new Error('No browser'));
      const service = new TestPlanItService({ ...defaultOptions, captureScreenshots: true });
      await expect(service.afterTest({}, {}, { passed: false })).resolves.toBeUndefined();
    });
  });
});
