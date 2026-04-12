import { type Request, type Response } from "express";
import { serializeError } from "serialize-error";

import {
  type NotificationResult,
  NOTIFY_STATUS,
} from "../../../../application/types/index.js";

import {
  type NotificationController,
  type NotificationControllerDependencies,
} from "./interfaces/index.js";
import {
  parseInitiator,
  validateBatchLimit,
  validateIncomingNotification,
} from "./utils/index.js";

export const createNotificationController = (
  dependencies: NotificationControllerDependencies,
): NotificationController => {
  const { receiveNotificationUseCase, receiveNotificationBatchUseCase } =
    dependencies;

  const send = async (req: Request, res: Response): Promise<void> => {
    const incomingNotificationValidationResult = validateIncomingNotification(
      req.body,
    );

    if (!incomingNotificationValidationResult.success) {
      res.status(400).json({
        message: "Уведомление не прошло валидацию",
        details: serializeError(incomingNotificationValidationResult.error),
      });
      return;
    }

    const incomingNotification = incomingNotificationValidationResult.data;
    const initiator = parseInitiator(req.user);

    const notification = await receiveNotificationUseCase.execute(
      incomingNotification,
      initiator,
    );

    res.status(200).json({
      payload: notification,
    });
  };

  const sendBatch = async (req: Request, res: Response): Promise<void> => {
    const batchLimitValidationResult = validateBatchLimit(req.body);
    if (!batchLimitValidationResult.success) {
      res.status(400).json({
        message: "Размер пакета уведомлений выходит за допустимые пределы",
        details: serializeError(batchLimitValidationResult.error),
      });
      return;
    }

    const batchItemsValidationResults = batchLimitValidationResult.data.map(
      (batchItem) => validateIncomingNotification(batchItem),
    );

    const validIncomingNotifications = batchItemsValidationResults
      .filter((batchItem) => batchItem.success)
      .map((batchItem) => batchItem.data);
    const initiator = parseInitiator(req.user);

    const notifyResults =
      validIncomingNotifications.length > 0
        ? await receiveNotificationBatchUseCase.execute(
            validIncomingNotifications,
            initiator,
          )
        : [];

    let notifyResultIndex = 0;
    const results: NotificationResult[] = batchItemsValidationResults.map(
      (batchItem) => {
        if (!batchItem.success) {
          return {
            status: NOTIFY_STATUS.CLIENT_ERROR,
            error: {
              message: "Уведомление не прошло валидацию",
              details: serializeError(batchItem.error),
            },
          };
        }
        return notifyResults[notifyResultIndex++];
      },
    );

    const totalCount = results.length;
    const acceptedCount = results.filter(
      (r) => r.status === NOTIFY_STATUS.SUCCESS,
    ).length;
    const rejectedCount = results.filter(
      (r) => r.status !== NOTIFY_STATUS.SUCCESS,
    ).length;

    res.status(rejectedCount > 0 ? 207 : 202).json({
      message:
        rejectedCount === 0
          ? "Все уведомления приняты в обработку"
          : "Не удалось обработать некоторые уведомления",
      payload: {
        summary: {
          total: totalCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
        },
        payload: results,
      },
    });
  };

  return { send, sendBatch };
};
