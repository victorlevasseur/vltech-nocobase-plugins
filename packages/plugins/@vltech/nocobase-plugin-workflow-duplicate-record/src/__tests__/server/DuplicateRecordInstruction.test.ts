/**
 * Unit tests for DuplicateRecordInstruction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JOB_STATUS } from '@nocobase/plugin-workflow';
import DuplicateRecordInstruction from '../../server/DuplicateRecordInstruction';

describe('DuplicateRecordInstruction', () => {
  let instruction: DuplicateRecordInstruction;
  let mockWorkflow: any;
  let mockProcessor: any;
  let mockNode: any;
  let mockCollection: any;
  let mockRepository: any;

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
    };

    // Mock collection
    mockCollection = {
      repository: mockRepository,
      getField: vi.fn(),
    };

    // Mock workflow with app and db
    mockWorkflow = {
      app: {
        db: {
          getCollection: vi.fn().mockReturnValue(mockCollection),
        },
      },
    };

    // Mock processor
    mockProcessor = {
      getParsedValue: vi.fn((config) => config),
      logger: {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
    };

    // Mock node
    mockNode = {
      id: 1,
      config: {},
    };

    instruction = new DuplicateRecordInstruction(mockWorkflow);
  });

  describe('run()', () => {
    describe('configuration validation', () => {
      it('should throw error when collection is not provided', async () => {
        mockNode.config = {};

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.FAILED);
        expect(result.result.error).toContain('Collection is required');
      });

      it('should throw error when collection is not found', async () => {
        mockNode.config = {
          collection: 'non_existent_collection',
          sourceRecordId: 1,
        };
        mockWorkflow.app.db.getCollection.mockReturnValue(null);

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.FAILED);
        expect(result.result.error).toContain('Collection "non_existent_collection" not found');
      });

      it('should throw error when sourceRecordId is not provided and not in prevJob', async () => {
        mockNode.config = {
          collection: 'users',
        };

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.FAILED);
        expect(result.result.error).toContain('Source record ID is required');
      });

      it('should use sourceRecordId from prevJob result when not in config', async () => {
        mockNode.config = {
          collection: 'users',
        };

        const prevJob = {
          result: {
            id: 42,
          },
        };

        const sourceRecord = {
          id: 42,
          name: 'John Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 42,
            name: 'John Doe',
          }),
        };

        const newRecord = {
          id: 43,
          name: 'John Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 43,
            name: 'John Doe',
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          if (fieldName === 'id') return null;
          if (fieldName === 'name') return { type: 'string' };
          return null;
        });

        const result = await instruction.run(mockNode, prevJob, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.RESOLVED);
        expect(mockRepository.findOne).toHaveBeenCalledWith({
          filterByTk: 42,
        });
      });

      it('should throw error when source record is not found', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 999,
        };

        mockRepository.findOne.mockResolvedValue(null);

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.FAILED);
        expect(result.result.error).toContain('Source record with ID "999" not found');
      });
    });

    describe('successful duplication', () => {
      it('should successfully duplicate a record with basic fields', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
        };

        const sourceRecord = {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          toJSON: vi.fn().mockReturnValue({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
          }),
        };

        const newRecord = {
          id: 2,
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          toJSON: vi.fn().mockReturnValue({
            id: 2,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          const fields = {
            id: null,
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'integer' },
          };
          return fields[fieldName] || null;
        });

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.RESOLVED);
        expect(result.result.id).toBe(2);
        expect(result.result.name).toBe('John Doe');
        expect(result.result.email).toBe('john@example.com');
        expect(mockRepository.create).toHaveBeenCalledWith({
          values: {
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
          },
        });
      });

      it('should exclude internal fields from duplication', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
        };

        const sourceRecord = {
          id: 1,
          name: 'John Doe',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-06-01'),
          createdById: 10,
          updatedById: 20,
          sort: 5,
          __v: 1,
          toJSON: vi.fn().mockReturnValue({
            id: 1,
            name: 'John Doe',
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-06-01'),
            createdById: 10,
            updatedById: 20,
            sort: 5,
            __v: 1,
          }),
        };

        const newRecord = {
          id: 2,
          name: 'John Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 2,
            name: 'John Doe',
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          if (['id', 'createdAt', 'updatedAt', 'createdById', 'updatedById', 'sort', '__v'].includes(fieldName)) {
            return null;
          }
          if (fieldName === 'name') return { type: 'string' };
          return null;
        });

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.RESOLVED);
        expect(mockRepository.create).toHaveBeenCalledWith({
          values: {
            name: 'John Doe',
          },
        });
        // Verify internal fields are not included
        const createCall = mockRepository.create.mock.calls[0][0];
        expect(createCall.values).not.toHaveProperty('id');
        expect(createCall.values).not.toHaveProperty('createdAt');
        expect(createCall.values).not.toHaveProperty('updatedAt');
        expect(createCall.values).not.toHaveProperty('createdById');
        expect(createCall.values).not.toHaveProperty('updatedById');
        expect(createCall.values).not.toHaveProperty('sort');
        expect(createCall.values).not.toHaveProperty('__v');
      });

      it('should exclude relation fields from duplication', async () => {
        mockNode.config = {
          collection: 'posts',
          sourceRecordId: 1,
        };

        const sourceRecord = {
          id: 1,
          title: 'My Post',
          authorId: 5,
          author: { id: 5, name: 'Author' },
          comments: [{ id: 1, text: 'Comment 1' }],
          tags: [{ id: 1, name: 'Tag1' }],
          toJSON: vi.fn().mockReturnValue({
            id: 1,
            title: 'My Post',
            authorId: 5,
            author: { id: 5, name: 'Author' },
            comments: [{ id: 1, text: 'Comment 1' }],
            tags: [{ id: 1, name: 'Tag1' }],
          }),
        };

        const newRecord = {
          id: 2,
          title: 'My Post',
          authorId: 5,
          toJSON: vi.fn().mockReturnValue({
            id: 2,
            title: 'My Post',
            authorId: 5,
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          const fields = {
            id: null,
            title: { type: 'string' },
            authorId: { type: 'integer' },
            author: { type: 'belongsTo' },
            comments: { type: 'hasMany' },
            tags: { type: 'belongsToMany' },
          };
          return fields[fieldName] || null;
        });

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.RESOLVED);
        const createCall = mockRepository.create.mock.calls[0][0];
        expect(createCall.values.title).toBe('My Post');
        expect(createCall.values.authorId).toBe(5); // Foreign key should be copied
        expect(createCall.values).not.toHaveProperty('author');
        expect(createCall.values).not.toHaveProperty('comments');
        expect(createCall.values).not.toHaveProperty('tags');
      });

      it('should apply field overrides correctly', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
          overrideFields: [
            { field: 'name', value: 'Jane Doe' },
            { field: 'email', value: 'jane@example.com' },
          ],
        };

        const sourceRecord = {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          toJSON: vi.fn().mockReturnValue({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
          }),
        };

        const newRecord = {
          id: 2,
          name: 'Jane Doe',
          email: 'jane@example.com',
          age: 30,
          toJSON: vi.fn().mockReturnValue({
            id: 2,
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 30,
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          const fields = {
            id: null,
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'integer' },
          };
          return fields[fieldName] || null;
        });

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.RESOLVED);
        expect(mockRepository.create).toHaveBeenCalledWith({
          values: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 30,
          },
        });
      });

      it('should not override id field even if specified', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
          overrideFields: [
            { field: 'id', value: 999 },
            { field: 'name', value: 'Jane Doe' },
          ],
        };

        const sourceRecord = {
          id: 1,
          name: 'John Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 1,
            name: 'John Doe',
          }),
        };

        const newRecord = {
          id: 2,
          name: 'Jane Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 2,
            name: 'Jane Doe',
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          const fields = {
            id: null,
            name: { type: 'string' },
          };
          return fields[fieldName] || null;
        });

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.RESOLVED);
        const createCall = mockRepository.create.mock.calls[0][0];
        expect(createCall.values).not.toHaveProperty('id');
        expect(createCall.values.name).toBe('Jane Doe');
      });
    });

    describe('error handling', () => {
      it('should return FAILED status on error by default', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
        };

        mockRepository.findOne.mockRejectedValue(new Error('Database error'));

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.FAILED);
        expect(result.result.error).toContain('Database error');
        expect(result.result.stack).toBeDefined();
        expect(mockProcessor.logger.error).toHaveBeenCalled();
      });

      it('should return RESOLVED status with error when ignoreFail is true', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
          ignoreFail: true,
        };

        mockRepository.findOne.mockRejectedValue(new Error('Database error'));

        const result = await instruction.run(mockNode, null, mockProcessor);

        expect(result.status).toBe(JOB_STATUS.RESOLVED);
        expect(result.result.error).toContain('Database error');
        expect(result.result.stack).toBeDefined();
      });
    });

    describe('logging', () => {
      it('should log execution steps', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
        };

        const sourceRecord = {
          id: 1,
          name: 'John Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 1,
            name: 'John Doe',
          }),
        };

        const newRecord = {
          id: 2,
          name: 'John Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 2,
            name: 'John Doe',
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          if (fieldName === 'id') return null;
          if (fieldName === 'name') return { type: 'string' };
          return null;
        });

        await instruction.run(mockNode, null, mockProcessor);

        expect(mockProcessor.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('starting for collection: users'),
        );
        expect(mockProcessor.logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('fetching source record with ID: 1'),
        );
        expect(mockProcessor.logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('duplicating record'),
        );
        expect(mockProcessor.logger.info).toHaveBeenCalledWith(
          expect.stringContaining('completed successfully. New record ID: 2'),
        );
      });

      it('should log field overrides', async () => {
        mockNode.config = {
          collection: 'users',
          sourceRecordId: 1,
          overrideFields: [{ field: 'name', value: 'Jane Doe' }],
        };

        const sourceRecord = {
          id: 1,
          name: 'John Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 1,
            name: 'John Doe',
          }),
        };

        const newRecord = {
          id: 2,
          name: 'Jane Doe',
          toJSON: vi.fn().mockReturnValue({
            id: 2,
            name: 'Jane Doe',
          }),
        };

        mockRepository.findOne.mockResolvedValue(sourceRecord);
        mockRepository.create.mockResolvedValue(newRecord);
        mockCollection.getField.mockImplementation((fieldName: string) => {
          if (fieldName === 'id') return null;
          if (fieldName === 'name') return { type: 'string' };
          return null;
        });

        await instruction.run(mockNode, null, mockProcessor);

        expect(mockProcessor.logger.debug).toHaveBeenCalledWith(
          expect.stringContaining('Overriding field "name"'),
        );
      });
    });
  });

  describe('resume()', () => {
    it('should return job unchanged if not failed', async () => {
      const job = {
        status: JOB_STATUS.RESOLVED,
        result: { id: 1 },
        set: vi.fn(),
      };
      mockNode.config = {
        ignoreFail: false,
      };

      const result = await instruction.resume(mockNode, job, mockProcessor);

      expect(result).toBe(job);
      expect(job.set).not.toHaveBeenCalled();
    });

    it('should return job unchanged if failed but ignoreFail is false', async () => {
      const job = {
        status: JOB_STATUS.FAILED,
        result: { error: 'Some error' },
        set: vi.fn(),
      };
      mockNode.config = {
        ignoreFail: false,
      };

      const result = await instruction.resume(mockNode, job, mockProcessor);

      expect(result).toBe(job);
      expect(job.set).not.toHaveBeenCalled();
    });

    it('should set status to RESOLVED if failed and ignoreFail is true', async () => {
      const job = {
        status: JOB_STATUS.FAILED,
        result: { error: 'Some error' },
        set: vi.fn(),
      };
      mockNode.config = {
        ignoreFail: true,
      };

      const result = await instruction.resume(mockNode, job, mockProcessor);

      expect(result).toBe(job);
      expect(job.set).toHaveBeenCalledWith('status', JOB_STATUS.RESOLVED);
    });
  });

  describe('field filtering', () => {
    it('should handle fields that do not exist in schema', async () => {
      mockNode.config = {
        collection: 'users',
        sourceRecordId: 1,
      };

      const sourceRecord = {
        id: 1,
        name: 'John Doe',
        unknownField: 'some value',
        toJSON: vi.fn().mockReturnValue({
          id: 1,
          name: 'John Doe',
          unknownField: 'some value',
        }),
      };

      const newRecord = {
        id: 2,
        name: 'John Doe',
        toJSON: vi.fn().mockReturnValue({
          id: 2,
          name: 'John Doe',
        }),
      };

      mockRepository.findOne.mockResolvedValue(sourceRecord);
      mockRepository.create.mockResolvedValue(newRecord);
      mockCollection.getField.mockImplementation((fieldName: string) => {
        if (fieldName === 'id') return null;
        if (fieldName === 'name') return { type: 'string' };
        // unknownField doesn't exist in schema
        if (fieldName === 'unknownField') return null;
        return null;
      });

      const result = await instruction.run(mockNode, null, mockProcessor);

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.values).not.toHaveProperty('unknownField');
      expect(createCall.values.name).toBe('John Doe');
    });

    it('should copy belongsTo foreign key fields', async () => {
      mockNode.config = {
        collection: 'posts',
        sourceRecordId: 1,
      };

      const sourceRecord = {
        id: 1,
        title: 'My Post',
        authorId: 5, // This is a foreign key field
        categoryId: 10,
        toJSON: vi.fn().mockReturnValue({
          id: 1,
          title: 'My Post',
          authorId: 5,
          categoryId: 10,
        }),
      };

      const newRecord = {
        id: 2,
        title: 'My Post',
        authorId: 5,
        categoryId: 10,
        toJSON: vi.fn().mockReturnValue({
          id: 2,
          title: 'My Post',
          authorId: 5,
          categoryId: 10,
        }),
      };

      mockRepository.findOne.mockResolvedValue(sourceRecord);
      mockRepository.create.mockResolvedValue(newRecord);
      mockCollection.getField.mockImplementation((fieldName: string) => {
        const fields = {
          id: null,
          title: { type: 'string' },
          authorId: { type: 'integer' }, // Foreign key as regular field
          categoryId: { type: 'integer' }, // Foreign key as regular field
        };
        return fields[fieldName] || null;
      });

      const result = await instruction.run(mockNode, null, mockProcessor);

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.values.authorId).toBe(5);
      expect(createCall.values.categoryId).toBe(10);
    });

    it('should handle hasOne relation fields correctly', async () => {
      mockNode.config = {
        collection: 'users',
        sourceRecordId: 1,
      };

      const sourceRecord = {
        id: 1,
        name: 'John Doe',
        profile: { id: 1, bio: 'My bio' }, // hasOne relation
        toJSON: vi.fn().mockReturnValue({
          id: 1,
          name: 'John Doe',
          profile: { id: 1, bio: 'My bio' },
        }),
      };

      const newRecord = {
        id: 2,
        name: 'John Doe',
        toJSON: vi.fn().mockReturnValue({
          id: 2,
          name: 'John Doe',
        }),
      };

      mockRepository.findOne.mockResolvedValue(sourceRecord);
      mockRepository.create.mockResolvedValue(newRecord);
      mockCollection.getField.mockImplementation((fieldName: string) => {
        const fields = {
          id: null,
          name: { type: 'string' },
          profile: { type: 'hasOne' },
        };
        return fields[fieldName] || null;
      });

      const result = await instruction.run(mockNode, null, mockProcessor);

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.values).not.toHaveProperty('profile');
      expect(createCall.values.name).toBe('John Doe');
    });
  });
});