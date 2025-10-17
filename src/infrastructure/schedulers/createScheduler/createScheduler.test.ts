import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createScheduler } from "./createScheduler.js";

describe("Scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start the task at the specified interval", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler({ task }, { interval: 5000 });

    scheduler.start();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(task).toHaveBeenCalledTimes(3);
  });

  it("should not run the task if already processing", async () => {
    const task = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10_000)),
      );
    const scheduler = createScheduler({ task }, { interval: 1000 });

    scheduler.start();

    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("should call onError when task throws", async () => {
    const task = vi.fn().mockRejectedValue(new Error("Task failed"));
    const onError = vi.fn();
    const scheduler = createScheduler({ task }, { onError, interval: 1000 });

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1000);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe(
      "В ходе работы планировщика произошла ошибка",
    );
    expect(onError.mock.calls[0][0].cause).toEqual(new Error("Task failed"));
  });

  it("should not run task after shutdown", async () => {
    const task = vi.fn();
    const scheduler = createScheduler({ task }, { interval: 1000 });

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(1);

    await scheduler.shutdown();

    await vi.advanceTimersByTimeAsync(5000);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("should wait for ongoing task to finish during shutdown", async () => {
    let resolveTask: () => void;
    const task = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveTask = resolve;
        }),
    );
    const scheduler = createScheduler({ task }, { interval: 1000 });

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(1);

    const shutdownPromise = scheduler.shutdown();

    resolveTask!();

    await vi.advanceTimersByTimeAsync(100);

    await shutdownPromise;

    await vi.advanceTimersByTimeAsync(2000);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("should allow restarting after shutdown", async () => {
    const task = vi.fn();
    const scheduler = createScheduler({ task }, { interval: 1000 });

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(1);

    await scheduler.shutdown();

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("should not start multiple timers if started twice", async () => {
    const task = vi.fn();
    const scheduler = createScheduler({ task }, { interval: 1000 });

    scheduler.start();
    scheduler.start();

    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(2);
  });
});
