import { describe, it, expect, vi } from "vitest";
import { ok, err, gen, tryPromise, all, partition, Result } from "../index";

describe("Generator-based Result", () => {
  describe("Result.gen", () => {
    it("should auto unwrap Ok values with yield*", () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) return err("Division by zero error");

        return ok(a / b);
      };

      const calculate = gen(function* () {
        const a = yield* divide(10, 2);
        const b = yield* divide(20, 4);
        const c = yield* divide(a + b, 2);
        return ok(c);
      });

      const result = calculate();
      expect(result.unwrap()).toBe(5);
    });

    it("should propagate errors immediately", () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) return err("Division by zero");
        return ok(a / b);
      };

      const calculate = gen(function* () {
        const a = yield* divide(10, 2);
        const b = yield* divide(20, 0);
        const c = yield* divide(a + b, 2);
        return ok(c);
      });

      const result = calculate();
      expect(result.isErr()).toBe(true);
      expect(result.expectErr("should error")).toBe("Division by zero");
    });

    it("should work with complex workflows", () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const validateEmail = (email: string): Result<string, string> => {
        if (!email.includes("@")) return err("Invalid email");
        return ok(email);
      };

      const validateName = (name: string): Result<string, string> => {
        if (name.length < 2) return err("Name too short");
        return ok(name);
      };

      const createUser = gen(function* (
        id: number,
        name: string,
        email: string
      ): Generator<Result<unknown, string>, Result<User, string>, unknown> {
        const validName = yield* validateName(name);
        const validEmail = yield* validateEmail(email);

        return ok({
          id,
          name: validName,
          email: validEmail,
        });
      });

      const user1 = createUser(1, "Alice", "alice@example.com");
      expect(user1.unwrap()).toEqual({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      });

      const user2 = createUser(2, "B", "bob@example.com");
      expect(user2.expectErr("should fail")).toBe("Name too short");

      const user3 = createUser(3, "Charlie", "invalid-email");
      expect(user3.expectErr("should fail")).toBe("Invalid email");
    });

    it("should handle multiple operations in sequence", () => {
      const parseNumber = (str: string): Result<number, string> => {
        const num = parseInt(str, 10);
        if (isNaN(num)) return err("Not a number");
        return ok(num);
      };

      const calculate = gen(function* (a: string, b: string) {
        const numA = yield* parseNumber(a);
        const numB = yield* parseNumber(b);
        return ok(numA + numB);
      });

      expect(calculate("10", "20").unwrap()).toBe(30);
      expect(calculate("abc", "20").isErr()).toBe(true);
    });

    it("should allow early returns", () => {
      const process = gen(function* (x: number) {
        if (x < 0) {
          return err("Negative not allowed");
        }

        const doubled = yield* ok(x * 2);
        return ok(doubled);
      });

      expect(process(-5).expectErr("should error")).toBe(
        "Negative not allowed"
      );
      expect(process(5).unwrap()).toBe(10);
    });
  });

  describe("Result.tryPromise", () => {
    it("should handle successful promises", async () => {
      const result = await tryPromise({
        try: async () => 42,
      });

      expect(result.unwrap()).toBe(42);
    });

    it("should handle failed promises", async () => {
      const result = await tryPromise({
        try: async () => {
          throw new Error("Failed");
        },
      });

      expect(result.isErr()).toBe(true);
    });

    it("should retry with linear backoff", async () => {
      let attempts = 0;

      const result = await tryPromise({
        try: async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("Not yet");
          }
          return "success";
        },
        retry: {
          times: 3,
          delayMs: 10,
          backoff: "linear",
        },
      });

      expect(attempts).toBe(3);
      expect(result.unwrap()).toBe("success");
    });

    it("should retry with exponential backoff", async () => {
      let attempts = 0;

      const result = await tryPromise({
        try: async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error("Not yet");
          }
          return "success";
        },
        retry: {
          times: 2,
          delayMs: 10,
          backoff: "exponential",
        },
      });

      expect(attempts).toBe(2);
      expect(result.unwrap()).toBe("success");
    });

    it("should map errors with catch handler", async () => {
      interface NetworkError {
        type: "NETWORK_ERROR";
        message: string;
      }

      const result = await tryPromise<string, NetworkError>({
        try: async () => {
          throw new Error("Connection failed");
        },
        catch: (error) => ({
          type: "NETWORK_ERROR",
          message: (error as Error).message,
        }),
      });

      expect(result.isErr()).toBe(true);
      const error = result.expectErr("should error");
      expect(error.type).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Connection failed");
    });

    it("should handle timeout errors", async () => {
      const result = await tryPromise({
        try: async () => {
          await new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10)
          );
          return "success";
        },
      });

      expect(result.isErr()).toBe(true);
    });
  });

  describe("Result.all", () => {
    it("should collect all Ok values", () => {
      const results = [ok(1), ok(2), ok(3)];
      const combined = all(results);

      expect(combined.unwrap()).toEqual([1, 2, 3]);
    });

    it("should return first Err if any", () => {
      const results = [ok(1), err("error"), ok(3)];
      const combined = all(results);

      expect(combined.isErr()).toBe(true);
      expect(combined.expectErr("should error")).toBe("error");
    });

    it("should handle empty array", () => {
      const results: Result<number, string>[] = [];
      const combined = all(results);

      expect(combined.unwrap()).toEqual([]);
    });

    it("should preserve error from first failure", () => {
      const results = [ok(1), err("first"), err("second")];
      const combined = all(results);

      expect(combined.expectErr("should error")).toBe("first");
    });
  });

  describe("Result.partition", () => {
    it("should separate Ok and Err values", () => {
      const results = [ok(1), err("error1"), ok(2), err("error2"), ok(3)];

      const { ok: okVals, err: errVals } = partition(results);

      expect(okVals).toEqual([1, 2, 3]);
      expect(errVals).toEqual(["error1", "error2"]);
    });

    it("should handle all Ok values", () => {
      const results = [ok(1), ok(2), ok(3)];
      const { ok: okVals, err: errVals } = partition(results);

      expect(okVals).toEqual([1, 2, 3]);
      expect(errVals).toEqual([]);
    });

    it("should handle all Err values", () => {
      const results = [err("e1"), err("e2"), err("e3")];
      const { ok: okVals, err: errVals } = partition(results);

      expect(okVals).toEqual([]);
      expect(errVals).toEqual(["e1", "e2", "e3"]);
    });

    it("should handle empty array", () => {
      const results: Result<number, string>[] = [];
      const { ok: okVals, err: errVals } = partition(results);

      expect(okVals).toEqual([]);
      expect(errVals).toEqual([]);
    });
  });

  describe("Generator iterator protocol", () => {
    it("should implement iterator for Ok", () => {
      const result = ok(42);
      const iterator = result[Symbol.iterator]();
      const next = iterator.next();

      expect(next.done).toBe(true);
      expect(next.value).toBe(42);
    });

    it("should implement iterator for Err", () => {
      const result = err("error");
      const iterator = result[Symbol.iterator]();
      const next = iterator.next();

      expect(next.done).toBe(false);
      expect(next.value).toBe(result);
    });
  });
});
