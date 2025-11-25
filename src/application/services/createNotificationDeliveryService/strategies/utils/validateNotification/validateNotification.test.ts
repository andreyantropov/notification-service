import { describe, it, expect } from "vitest";

import { validateNotification } from "./validateNotification.js";
import { CHANNEL_TYPES } from "../../../../../../domain/types/ChannelTypes.js";
import { Contact } from "../../../../../../domain/types/Contact.js";
import { Notification } from "../../../../../../domain/types/Notification.js";

describe("validateNotification", () => {
  it("should return false when contacts is undefined", () => {
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: undefined as unknown as Contact[],
      message: "Hello",
    };

    expect(validateNotification(notification)).toBe(false);
  });

  it("should return false when contacts is empty array", () => {
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [],
      message: "Hello",
    };

    expect(validateNotification(notification)).toBe(false);
  });

  it("should return false when message is empty string", () => {
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [
        {
          type: CHANNEL_TYPES.EMAIL,
          value: "test@example.com",
        },
      ],
      message: "",
    };

    expect(validateNotification(notification)).toBe(false);
  });

  it("should return true when notification has contacts and non-empty message", () => {
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [{ type: CHANNEL_TYPES.EMAIL, value: "test@example.com" }],
      message: "Hello",
    };

    expect(validateNotification(notification)).toBe(true);
  });

  it("should return true when notification has multiple contacts and valid message", () => {
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [
        { type: CHANNEL_TYPES.EMAIL, value: "test@example.com" },
        { type: CHANNEL_TYPES.BITRIX, value: 123 },
      ],
      message: "Important update",
    };

    expect(validateNotification(notification)).toBe(true);
  });

  it("should return false when both contacts is empty and message is empty", () => {
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [],
      message: "",
    };

    expect(validateNotification(notification)).toBe(false);
  });
});
