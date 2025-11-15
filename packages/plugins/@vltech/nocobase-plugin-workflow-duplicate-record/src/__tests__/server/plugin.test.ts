/**
 * Unit tests for PluginWorkflowDuplicateRecord
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import PluginWorkflowDuplicateRecord from '../../server/plugin';
import DuplicateRecordInstruction from '../../server/DuplicateRecordInstruction';

describe('PluginWorkflowDuplicateRecord', () => {
  let plugin: PluginWorkflowDuplicateRecord;
  let mockWorkflowPlugin: any;
  let mockApp: any;
  let mockPm: any;

  beforeEach(() => {
    // Mock workflow plugin
    mockWorkflowPlugin = {
      registerInstruction: vi.fn(),
    };

    // Mock plugin manager
    mockPm = {
      get: vi.fn().mockReturnValue(mockWorkflowPlugin),
    };

    // Mock app with logger
    mockApp = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
    };

    // Create plugin instance with mocked dependencies
    plugin = new PluginWorkflowDuplicateRecord({} as any, {} as any);

    // Use Object.defineProperty to set read-only properties
    Object.defineProperty(plugin, 'pm', {
      value: mockPm,
      writable: false,
      configurable: true,
    });

    Object.defineProperty(plugin, 'app', {
      value: mockApp,
      writable: false,
      configurable: true,
    });
  });

  describe('load()', () => {
    it('should register duplicate-record instruction with workflow plugin', async () => {
      await plugin.load();

      expect(mockPm.get).toHaveBeenCalled();
      expect(mockWorkflowPlugin.registerInstruction).toHaveBeenCalledWith(
        'duplicate-record',
        DuplicateRecordInstruction,
      );
    });

    it('should log success message when loaded', async () => {
      await plugin.load();

      expect(mockApp.logger.info).toHaveBeenCalledWith(
        'Workflow duplicate-record plugin loaded',
      );
    });

    it('should throw error if workflow plugin is not available', async () => {
      mockPm.get.mockReturnValue(null);

      await expect(plugin.load()).rejects.toThrow(
        'Workflow plugin is required for duplicate-record plugin',
      );
    });

    it('should throw error if workflow plugin is undefined', async () => {
      mockPm.get.mockReturnValue(undefined);

      await expect(plugin.load()).rejects.toThrow(
        'Workflow plugin is required for duplicate-record plugin',
      );
    });
  });

  describe('lifecycle hooks', () => {
    it('should have afterAdd hook', () => {
      expect(plugin.afterAdd).toBeDefined();
      expect(typeof plugin.afterAdd).toBe('function');
    });

    it('should have beforeLoad hook', () => {
      expect(plugin.beforeLoad).toBeDefined();
      expect(typeof plugin.beforeLoad).toBe('function');
    });

    it('should have install hook', () => {
      expect(plugin.install).toBeDefined();
      expect(typeof plugin.install).toBe('function');
    });

    it('should have afterEnable hook', () => {
      expect(plugin.afterEnable).toBeDefined();
      expect(typeof plugin.afterEnable).toBe('function');
    });

    it('should have afterDisable hook', () => {
      expect(plugin.afterDisable).toBeDefined();
      expect(typeof plugin.afterDisable).toBe('function');
    });

    it('should have remove hook', () => {
      expect(plugin.remove).toBeDefined();
      expect(typeof plugin.remove).toBe('function');
    });

    it('should execute afterAdd without errors', async () => {
      await expect(plugin.afterAdd()).resolves.not.toThrow();
    });

    it('should execute beforeLoad without errors', async () => {
      await expect(plugin.beforeLoad()).resolves.not.toThrow();
    });

    it('should execute install without errors', async () => {
      await expect(plugin.install()).resolves.not.toThrow();
    });

    it('should execute afterEnable without errors', async () => {
      await expect(plugin.afterEnable()).resolves.not.toThrow();
    });

    it('should execute afterDisable without errors', async () => {
      await expect(plugin.afterDisable()).resolves.not.toThrow();
    });

    it('should execute remove without errors', async () => {
      await expect(plugin.remove()).resolves.not.toThrow();
    });
  });
});
