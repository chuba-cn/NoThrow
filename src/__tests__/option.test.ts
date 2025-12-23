import { describe, it, expect } from "vitest";
import { some, none, fromNullable } from "../index";

describe("Option", () => {
  describe("Some", () => {
    it("should create a Some value", () => {
      const opt = some(42);
      expect(opt.isSome()).toBe(true);
      expect(opt.isNone()).toBe(false);
    });

    it("should unwrap to the inner value", () => {
      const opt = some(42);
      expect(opt.unwrap()).toBe(42);
    });

    it("should map over the value", () => {
      const opt = some(42);
      const result = opt.map((x) => x * 2);
      expect(result.unwrap()).toBe(84);
    });

    it("should flatMap correctly", () => {
      const opt = some(42);
      const result = opt.flatMap((x) => some(x * 2));
      expect(result.unwrap()).toBe(84);
    });

    it("should flatMap to None", () => {
      const opt = some(42);
      const result = opt.flatMap(() => none());
      expect(result.isNone()).toBe(true);
    });

    it("should filter values", () => {
      const opt = some(42);
      expect(opt.filter((x) => x > 40).isSome()).toBe(true);
      expect(opt.filter((x) => x < 40).isNone()).toBe(true);
    });

    it("should handle match", () => {
      const opt = some(42);
      const result = opt.match({
        some: (x) => x * 2,
        none: () => 0,
      });
      expect(result).toBe(84);
    });

    it("should handle and/or operations", () => {
      const opt1 = some(42);
      const opt2 = some(100);
      const opt3 = none();

      expect(opt1.and(opt2).unwrap()).toBe(100);
      expect(opt1.and(opt3).isNone()).toBe(true);
      expect(opt1.or(opt2).unwrap()).toBe(42);
    });

    it("should return value with unwrapOr", () => {
      const opt = some(42);
      expect(opt.unwrapOr(99)).toBe(42);
    });

    it("should return value with unwrapOrElse", () => {
      const opt = some(42);
      expect(opt.unwrapOrElse(() => 99)).toBe(42);
    });

    it("should convert to Ok with okOr", () => {
      const opt = some(42);
      const result = opt.okOr("error");
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(42);
    });

    it("should convert to Ok with okOrElse", () => {
      const opt = some(42);
      const result = opt.okOrElse(() => "error");
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(42);
    });
  });

  describe("None", () => {
    it("should create a None value", () => {
      const opt = none();
      expect(opt.isNone()).toBe(true);
      expect(opt.isSome()).toBe(false);
    });

    it("should throw when unwrapping", () => {
      const opt = none();
      expect(() => opt.unwrap()).toThrow("Called unwrap on a None value");
    });

    it("should return default with unwrapOr", () => {
      const opt = none<number>();
      expect(opt.unwrapOr(99)).toBe(99);
    });

    it("should execute function with unwrapOrElse", () => {
      const opt = none<number>();
      expect(opt.unwrapOrElse(() => 99)).toBe(99);
    });

    it("should map to None", () => {
      const opt = none<number>();
      const result = opt.map((x) => x * 2);
      expect(result.isNone()).toBe(true);
    });

    it("should handle match", () => {
      const opt = none<number>();
      const result = opt.match({
        some: (x) => x * 2,
        none: () => 0,
      });
      expect(result).toBe(0);
    });

    it("should handle and/or operations", () => {
      const opt1 = none<number>();
      const opt2 = some(100);
      const opt3 = none<number>();

      expect(opt1.and(opt2).isNone()).toBe(true);
      expect(opt1.or(opt2).unwrap()).toBe(100);
      expect(opt1.or(opt3).isNone()).toBe(true);
    });

    it("should be a singleton", () => {
      const opt1 = none();
      const opt2 = none();
      expect(opt1).toBe(opt2);
    });

    it("should throw with custom message using expect", () => {
      const opt = none<number>();
      expect(() => opt.expect("Custom error")).toThrow("Custom error");
    });

    it("should convert to Err with okOr", () => {
      const opt = none<number>();
      const result = opt.okOr("error");
      expect(result.isErr()).toBe(true);
      expect(result.expectErr("should error")).toBe("error");
    });

    it("should convert to Err with okOrElse", () => {
      const opt = none<number>();
      const result = opt.okOrElse(() => "error");
      expect(result.isErr()).toBe(true);
      expect(result.expectErr("should error")).toBe("error");
    });
  });

  describe("fromNullable", () => {
    it("should convert non-null values to Some", () => {
      expect(fromNullable(42).unwrap()).toBe(42);
      expect(fromNullable("hello").unwrap()).toBe("hello");
      expect(fromNullable(0).unwrap()).toBe(0);
      expect(fromNullable(false).unwrap()).toBe(false);
    });

    it("should convert null to None", () => {
      expect(fromNullable(null).isNone()).toBe(true);
    });

    it("should convert undefined to None", () => {
      expect(fromNullable(undefined).isNone()).toBe(true);
    });
  });
});
