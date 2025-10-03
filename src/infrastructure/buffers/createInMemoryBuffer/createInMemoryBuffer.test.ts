import { describe, it, expect } from "vitest";

import { createInMemoryBuffer } from "./createInMemoryBuffer.js";
import { Notification } from "../../../domain/types/Notification.js";

const mockNotification = (
  message: string,
  recipientEmail: string,
): Notification => ({
  recipients: [{ type: "email", value: recipientEmail }],
  message,
});

describe("createInMemoryBuffer", () => {
  it("should start empty", async () => {
    const buffer = createInMemoryBuffer();
    const result = await buffer.takeAll();
    expect(result).toHaveLength(0);
  });

  it("should append notifications and keep them in buffer", async () => {
    const buffer = createInMemoryBuffer();
    const notif1 = mockNotification("Hello", "user1@com");
    const notif2 = mockNotification("World", "user2@com");

    await buffer.append([notif1, notif2]);

    const result = await buffer.takeAll();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(notif1);
    expect(result).toContainEqual(notif2);
  });

  it("should return a copy of the buffer, not the original reference", async () => {
    const buffer = createInMemoryBuffer();
    const notif = mockNotification("Test", "test@com");
    await buffer.append([notif]);

    const result = await buffer.takeAll();
    result.push(mockNotification("Mutated", "evil@com"));

    const secondRead = await buffer.takeAll();
    expect(secondRead).toHaveLength(0);
    expect(result).toHaveLength(2);
  });

  it("should clear the buffer after takeAll", async () => {
    const buffer = createInMemoryBuffer();
    await buffer.append([mockNotification("Msg", "user@com")]);

    await buffer.takeAll();
    const secondResult = await buffer.takeAll();

    expect(secondResult).toHaveLength(0);
  });

  it("should handle multiple appends correctly", async () => {
    const buffer = createInMemoryBuffer();
    await buffer.append([mockNotification("A", "a@com")]);
    await buffer.append([
      mockNotification("B", "b@com"),
      mockNotification("C", "c@com"),
    ]);

    const result = await buffer.takeAll();
    expect(result).toHaveLength(3);
  });

  it("should handle empty array in append", async () => {
    const buffer = createInMemoryBuffer();
    const initial = await buffer.takeAll();
    expect(initial).toHaveLength(0);

    await buffer.append([]);
    const result = await buffer.takeAll();
    expect(result).toHaveLength(0);
  });

  it("should not share state between buffer instances", async () => {
    const buffer1 = createInMemoryBuffer();
    const buffer2 = createInMemoryBuffer();

    const notif1 = mockNotification("Isolated", "user@com");
    await buffer1.append([notif1]);

    const result1 = await buffer1.takeAll();
    const result2 = await buffer2.takeAll();

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(0);
  });
});
