import { describe, it, expect } from "vitest";
import { ok, err, fromThrowable, fromPromise } from "../index";

describe("Result", () => {
  describe("Ok", () => {
    it("should create an Ok value", () => {
      const result = ok(2);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result.ok()).toBe(true);
    });

    it("should unwrap to the inner value", () => {
      const result = ok(42);
      expect(result.unwrap()).toBe(42);
    });

    it("should map over the value", () => {
      const result = ok(42);
      const mapped = result.map((value) => value * 2);
      expect(mapped.unwrap()).toBe(84);
    });

    it("should not map errors", () => {
      const result = ok<number, string>(42);
      const mapped = result.mapErr((e) => e.toUpperCase());
      expect(mapped.unwrap()).toBe(42);
    });

    it("should flatMap correctly", () => {
      const result = ok(42);
      const mapped = result.flatMap((x) => ok(x * 2));
      expect(mapped.unwrap()).toBe(84);
    });

    it("should flatMap to Err", () => {
      const result = ok(42);
      const mapped = result.flatMap(() => err("error"));
      expect(mapped.isErr()).toBe(true);
    });

    it("should handle match", () => {
      const result = ok<number, string>(42);
      const matched = result.match({
        ok: (x) => x * 2,
        err: () => 0,
      });

      expect(matched).toBe(84);
    });

    it("should handle and/or operations", () => {
      const result1 = ok<number, string>(42);
      const result2 = ok<number, string>(100);
      const result3 = err<number, string>("error");

      expect(result1.and(result2).unwrap()).toBe(100);
      expect(result1.and(result3).isErr()).toBe(true);
      expect(result1.or(result2).unwrap()).toBe(42);
    });

    it("should return value with unwrapOr", () => {
      const result = ok(42);
      expect(result.unwrapOr(99)).toBe(42);
    });

    it("should return value with unwrapOrElse", () => {
      const result = ok<number, string>(42);
      expect(result.unwrapOrElse(() => 99)).toBe(42);
    });
  });

  describe("Err", () => {
    it("should create an Err value", () => {
      const result = err("error");
      expect(result.isErr()).toBe(true);
      expect(result.isOk()).toBe(false);
      expect(result.ok()).toBe(false);
    });

    it("should throw when unwrapping", () => {
      const result = err("error");
      expect(() => result.unwrap()).toThrow("Called unwrap on an Err value");
    });

    it("should return default with unwrapOr", () => {
      const result = err<number, string>("error");
      expect(result.unwrapOr(99)).toBe(99);
    });

    it("should execute function with unwrapOrElse", () => {
      const result = err<number, string>("error");
      expect(result.unwrapOrElse((e) => e.length)).toBe(5);
    });

    it("should map to Err", () => {
      const result = err<number, string>("error");
      const mapped = result.map((x) => x * 2);
      expect(mapped.isErr()).toBe(true);
    });

    it("should map errors", () => {
      const result = err<number, string>("error");
      const mapped = result.mapErr((e) => e.toUpperCase());
      expect(mapped.expectErr("should be error")).toBe("ERROR");
    });

    it("should handle match", () => {
      const result = err<number, string>("error");
      const matched = result.match({
        ok: (x) => x * 2,
        err: (e) => e.length,
      });
      expect(matched).toBe(5);
    });

    it("should handle and/or operations", () => {
      const result1 = err<number, string>("error1");
      const result2 = ok<number, string>(100);
      const result3 = err<number, string>("error2");

      expect(result1.and(result2).isErr()).toBe(true);
      expect(result1.or(result2).unwrap()).toBe(100);
      expect(result1.or(result3).expectErr("should error")).toBe("error2");
    });

    it("should throw with custom message using expect", () => {
      const result = err<number, string>("error");
      expect(() => result.expect("Custom error")).toThrow("Custom error");
    });

    it("should return error with expectErr", () => {
      const result = err<number, string>("my-error");
      expect(result.expectErr("message")).toBe("my-error");
    });
  });

  describe("fromThrowable", () => {
    it("should convert successful function to Ok", () => {
      const result = fromThrowable(() => 42);
      expect(result.unwrap()).toBe(42);
    });

    it("should convert throwing function to Err", () => {
      const result = fromThrowable(() => {
        throw new Error("oops");
      });
      expect(result.isErr()).toBe(true);
    });

    it("should preserve error type", () => {
      const result = fromThrowable<number, Error>(() => {
        throw new Error("oops");
      });
      expect(result.isErr()).toBe(true);

      const error = result.expectErr("should error");
      expect(error.message).toBe("oops");
    });
  });

  describe("fromPromise", () => {
    it("should convert resolved promise to Ok", async () => {
      const result = await fromPromise(Promise.resolve(42));
      expect(result.unwrap()).toBe(42);
    });

    it("should convert rejected promise to Err", async () => {
      const result = await fromPromise(Promise.reject(new Error("oops")));
      expect(result.isErr()).toBe(true);
    });

    it("should preserve error from rejected promise", async () => {
      const result = await fromPromise<number, Error>(
        Promise.reject(new Error("test error"))
      );
      expect(result.isErr()).toBe(true);

      const error = result.expectErr("should error");
      expect(error.message).toBe("test error");
    });
  });
});
