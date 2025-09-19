import { describe, it, expect } from "vitest";

import { validateNotification } from "./validateNotification.js";
import { Notification } from "../../../../../../domain/types/Notification.js";
import { Recipient } from "../../../../../../domain/types/Recipient.js";

describe("validateNotification", () => {
  it("should return false when recipients is undefined", () => {
    const notification: Notification = {
      recipients: undefined as unknown as Recipient[],
      message: "Hello",
    };

    expect(validateNotification(notification)).toBe(false);
  });

  it("should return false when recipients is empty array", () => {
    const notification: Notification = {
      recipients: [],
      message: "Hello",
    };

    expect(validateNotification(notification)).toBe(false);
  });

  it("should return false when message is empty string", () => {
    const notification: Notification = {
      recipients: [{ type: "email", value: "test@example.com" }],
      message: "",
    };

    expect(validateNotification(notification)).toBe(false);
  });

  it("should return true when notification has recipients and non-empty message", () => {
    const notification: Notification = {
      recipients: [{ type: "email", value: "test@example.com" }],
      message: "Hello",
    };

    expect(validateNotification(notification)).toBe(true);
  });

  it("should return true when notification has multiple recipients and valid message", () => {
    const notification: Notification = {
      recipients: [
        { type: "email", value: "test@example.com" },
        { type: "bitrix", value: 123 },
      ],
      message: "Important update",
    };

    expect(validateNotification(notification)).toBe(true);
  });

  it("should return false when both recipients is empty and message is empty", () => {
    const notification: Notification = {
      recipients: [],
      message: "",
    };

    expect(validateNotification(notification)).toBe(false);
  });
});
