import { describe, expect, it, vi } from "vitest";

import { type Channel } from "../../../ports/index.js";
import { type Contact } from "../../../types/index.js";

import { getAttempts } from "./getAttempts.js";

describe("getAttempts", () => {
  const createMockChannel = (id: string, supports: boolean): Channel =>
    ({
      id,
      isSupports: vi.fn().mockReturnValue(supports),
    }) as unknown as Channel;

  const mockEmailContact: Contact = {
    type: "email",
    value: "test@example.com",
  };

  const mockBitrixContact: Contact = {
    type: "bitrix",
    value: 12345,
  };

  it("should return empty array when no channels support contacts", () => {
    const channels = [createMockChannel("ch1", false)];
    const contacts = [mockEmailContact];

    const result = getAttempts(contacts, channels);

    expect(result).toEqual([]);
    expect(channels[0].isSupports).toHaveBeenCalledWith(mockEmailContact);
  });

  it("should create attempts only for supported contact-channel pairs", () => {
    const channel1 = createMockChannel("ch1", true);
    const channel2 = createMockChannel("ch2", false);
    const contacts = [mockEmailContact];

    const result = getAttempts(contacts, [channel1, channel2]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ channel: channel1, contact: mockEmailContact });
  });

  it("should multiply attempts when multiple channels support multiple contacts", () => {
    const channel1 = createMockChannel("ch1", true);
    const channel2 = createMockChannel("ch2", true);
    const contacts = [mockEmailContact, mockBitrixContact];

    const result = getAttempts(contacts, [channel1, channel2]);

    expect(result).toHaveLength(4);
    expect(result).toContainEqual({
      channel: channel1,
      contact: mockEmailContact,
    });
    expect(result).toContainEqual({
      channel: channel2,
      contact: mockBitrixContact,
    });
  });

  it("should handle empty inputs gracefully", () => {
    expect(getAttempts([], [])).toEqual([]);
    expect(getAttempts([mockEmailContact], [])).toEqual([]);
  });
});
