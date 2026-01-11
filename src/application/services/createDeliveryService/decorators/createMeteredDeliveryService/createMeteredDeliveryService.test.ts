import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

import { createMeteredDeliveryService } from './createMeteredDeliveryService.js';
import type { MeteredDeliveryServiceDependencies } from './interfaces/index.js';
import type { Result } from '../../interfaces/index.js';
import { DeliveryStrategy } from '../../../../../domain/enums/DeliveryStrategy.js';
import type { Notification } from '../../../../../domain/types/Notification.js';
import type { Meter } from '../../../../ports/index.js';

import {
  DEFAULT_SUBJECT,
  DEFAULT_STRATEGY,
  DEFAULT_IS_IMMEDIATE,
  NOTIFICATIONS_PROCESSED_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_STRATEGY_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL,
} from './constants/index.js';

describe('createMeteredDeliveryService', () => {
  let mockDeliveryService: {
    send: Mock;
    checkHealth?: Mock;
  };
  let mockMeter: {
    increment: Mock;
    record: Mock;
  };
  let dependencies: MeteredDeliveryServiceDependencies;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDeliveryService = {
      send: vi.fn(),
      checkHealth: vi.fn(),
    };

    mockMeter = {
      increment: vi.fn(),
      record: vi.fn(),
    };

    dependencies = {
      deliveryService: mockDeliveryService,
      meter: mockMeter as Meter,
    };
  });

  it('should create a service with send and checkHealth methods', () => {
    const service = createMeteredDeliveryService(dependencies);

    expect(typeof service.send).toBe('function');
    expect(typeof service.checkHealth).toBe('function');
  });

  it('should proxy checkHealth to underlying delivery service', async () => {
    mockDeliveryService.checkHealth = vi.fn().mockResolvedValue(undefined);
    const service = createMeteredDeliveryService(dependencies);

    await service.checkHealth?.();

    expect(mockDeliveryService.checkHealth).toHaveBeenCalledTimes(1);
  });

  describe('send', () => {
    const mockNotification: Notification = {
      id: 'test-id',
      createdAt: '2024-01-01T00:00:00Z',
      contacts: [],
      message: 'Test message',
    };

    it('should call underlying delivery service send method', async () => {
      const mockResults: Result[] = [];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      const notifications = [mockNotification];
      const results = await service.send(notifications);

      expect(mockDeliveryService.send).toHaveBeenCalledTimes(1);
      expect(mockDeliveryService.send).toHaveBeenCalledWith(notifications);
      expect(results).toBe(mockResults);
    });

    it('should increment metrics for each result', async () => {
      const mockResults: Result[] = [
        {
          status: 'success',
          notification: mockNotification,
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([mockNotification]);

      expect(mockMeter.increment).toHaveBeenCalledTimes(5);
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_TOTAL);
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL, { status: 'success' });
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL, { subjectId: DEFAULT_SUBJECT });
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STRATEGY_TOTAL, { strategy: DEFAULT_STRATEGY });
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL, { isImmediate: DEFAULT_IS_IMMEDIATE ? 'true' : 'false' });
    });

    it('should handle multiple notifications', async () => {
      const mockResults: Result[] = [
        {
          status: 'success',
          notification: { ...mockNotification, id: 'id1' },
        },
        {
          status: 'failure',
          notification: { ...mockNotification, id: 'id2' },
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([mockNotification, mockNotification]);

      expect(mockMeter.increment).toHaveBeenCalledTimes(10);
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_TOTAL);
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL, { status: 'success' });
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL, { status: 'failure' });
    });

    it('should use notification subject ID when present', async () => {
      const notificationWithSubject: Notification = {
        ...mockNotification,
        subject: {
          id: 'custom-subject-id',
          name: 'Test Subject',
        },
      };

      const mockResults: Result[] = [
        {
          status: 'success',
          notification: notificationWithSubject,
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([notificationWithSubject]);

      expect(mockMeter.increment).toHaveBeenCalledWith(
        NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL,
        { subjectId: 'custom-subject-id' }
      );
    });

    it('should use default subject when notification has no subject', async () => {
      const notificationWithoutSubject: Notification = {
        ...mockNotification,
        subject: undefined,
      };

      const mockResults: Result[] = [
        {
          status: 'success',
          notification: notificationWithoutSubject,
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([notificationWithoutSubject]);

      expect(mockMeter.increment).toHaveBeenCalledWith(
        NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL,
        { subjectId: DEFAULT_SUBJECT }
      );
    });

    it('should use default strategy when not provided', async () => {
      const notificationWithoutStrategy: Notification = {
        ...mockNotification,
        strategy: undefined,
      };

      const mockResults: Result[] = [
        {
          status: 'success',
          notification: notificationWithoutStrategy,
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([notificationWithoutStrategy]);

      expect(mockMeter.increment).toHaveBeenCalledWith(
        NOTIFICATIONS_PROCESSED_BY_STRATEGY_TOTAL,
        { strategy: DEFAULT_STRATEGY }
      );
    });

    it('should handle immediate notifications', async () => {
      const immediateNotification: Notification = {
        ...mockNotification,
        isImmediate: true,
      };

      const mockResults: Result[] = [
        {
          status: 'success',
          notification: immediateNotification,
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([immediateNotification]);

      expect(mockMeter.increment).toHaveBeenCalledWith(
        NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL,
        { isImmediate: 'true' }
      );
    });

    it('should handle non-immediate notifications', async () => {
      const nonImmediateNotification: Notification = {
        ...mockNotification,
        isImmediate: false,
      };

      const mockResults: Result[] = [
        {
          status: 'success',
          notification: nonImmediateNotification,
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([nonImmediateNotification]);

      expect(mockMeter.increment).toHaveBeenCalledWith(
        NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL,
        { isImmediate: 'false' }
      );
    });

    it('should use default isImmediate when not provided', async () => {
      const notificationWithoutPriority: Notification = {
        ...mockNotification,
        isImmediate: undefined,
      };

      const mockResults: Result[] = [
        {
          status: 'success',
          notification: notificationWithoutPriority,
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([notificationWithoutPriority]);

      expect(mockMeter.increment).toHaveBeenCalledWith(
        NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL,
        { isImmediate: DEFAULT_IS_IMMEDIATE ? 'true' : 'false' }
      );
    });

    it('should handle results with additional properties', async () => {
      const mockResults: Result[] = [
        {
          status: 'success',
          notification: mockNotification,
          details: { some: 'detail' },
          error: null,
          warnings: [],
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([mockNotification]);

      expect(mockMeter.increment).toHaveBeenCalledTimes(5);
    });

    it('should propagate errors from underlying service', async () => {
      const error = new Error('Delivery failed');
      mockDeliveryService.send.mockRejectedValue(error);
      const service = createMeteredDeliveryService(dependencies);

      await expect(service.send([mockNotification])).rejects.toThrow('Delivery failed');
      expect(mockMeter.increment).not.toHaveBeenCalled();
    });

    it('should work with empty notifications array', async () => {
      const mockResults: Result[] = [];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      const results = await service.send([]);

      expect(results).toEqual([]);
      expect(mockMeter.increment).not.toHaveBeenCalled();
    });

    it('should handle notification with all optional fields', async () => {
      const completeNotification: Notification = {
        id: 'complete-id',
        createdAt: '2024-01-01T00:00:00Z',
        contacts: [],
        message: 'Complete message',
        isImmediate: true,
        strategy: DeliveryStrategy.sendToFirstAvailable,
        subject: {
          id: 'subject-id',
          name: 'Subject Name',
        },
      };

      const mockResults: Result[] = [
        {
          status: 'failure',
          notification: completeNotification,
          error: 'Some error',
        },
      ];
      mockDeliveryService.send.mockResolvedValue(mockResults);
      const service = createMeteredDeliveryService(dependencies);

      await service.send([completeNotification]);

      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_TOTAL);
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL, { status: 'failure' });
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL, { subjectId: 'subject-id' });
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STRATEGY_TOTAL, { strategy: 'send_to_first_available' });
      expect(mockMeter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL, { isImmediate: 'true' });
    });
  });

  it('should return the same checkHealth function reference', () => {
    const service = createMeteredDeliveryService(dependencies);

    expect(service.checkHealth).toBe(mockDeliveryService.checkHealth);
  });

  it('should handle delivery service without checkHealth', () => {
    const dependenciesWithoutHealthCheck: MeteredDeliveryServiceDependencies = {
      deliveryService: {
        send: vi.fn(),
      },
      meter: mockMeter as Meter,
    };

    const service = createMeteredDeliveryService(dependenciesWithoutHealthCheck);

    expect(service.checkHealth).toBeUndefined();
  });
});