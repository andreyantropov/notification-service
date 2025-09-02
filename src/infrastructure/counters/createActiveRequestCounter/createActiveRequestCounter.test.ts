import { describe, it, expect, beforeEach } from "vitest";
import { createActiveRequestCounter } from "./createActiveRequestCounter.js";
import { Counter } from "../../ports/Counter.js";

describe("createActiveRequestCounter", () => {
  let counter: Counter;

  beforeEach(() => {
    counter = createActiveRequestCounter();
  });

  it("should initialize with value 0", () => {
    expect(counter.value).toBe(0);
  });

  it("should increase value by 1 when increase is called", () => {
    counter.increase();
    expect(counter.value).toBe(1);

    counter.increase();
    expect(counter.value).toBe(2);
  });

  it("should decrease value by 1 when decrease is called and value > 0", () => {
    counter.increase();
    counter.increase();

    counter.decrease();
    expect(counter.value).toBe(1);

    counter.decrease();
    expect(counter.value).toBe(0);
  });

  it("should not decrease value below 0", () => {
    counter.decrease();
    expect(counter.value).toBe(0);

    counter.increase();
    expect(counter.value).toBe(1);

    counter.decrease();
    expect(counter.value).toBe(0);

    counter.decrease();
    expect(counter.value).toBe(0);
  });

  it("should return current value via getter", () => {
    expect(counter.value).toBe(0);

    counter.increase();
    expect(counter.value).toBe(1);

    counter.increase();
    counter.increase();
    expect(counter.value).toBe(3);

    counter.decrease();
    expect(counter.value).toBe(2);
  });

  it("should maintain independent state between instances", () => {
    const counter1 = createActiveRequestCounter();
    const counter2 = createActiveRequestCounter();

    counter1.increase();
    counter1.increase();

    counter2.increase();

    expect(counter1.value).toBe(2);
    expect(counter2.value).toBe(1);
  });
});
