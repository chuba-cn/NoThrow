/**
 * Result is a type that represents either a success (Ok) or a failure (Err).
 * It can be used with generator functions for automatic error propagation using "yield*".
 */

export type Result<T, E> = Ok<T, E> | Err<T, E>;

interface ResultMethods<T, E> {
  /**
   * Returns `true` if the result is {@link Ok}.
   */
  isOk(): this is Ok<T, E>;

  /**
   * Returns `true` if the result is {@link Err}.
   */
  isErr(): this is Err<T, E>;

  /**
   * Returns `true` if the result is {@link Ok}.
   */
  ok(): boolean;

  /**
   * Returns the contained {@link Ok} value.
   *
   * @throws {Error} if the value is an {@link Err}.
   */
  unwrap(): T;

  /**
   * Returns the contained {@link Ok} value or a provided default.
   */
  unwrapOr(defaultValue: T): T;

  /**
   * Returns the contained {@link Ok} value or computes it from a closure.
   */
  unwrapOrElse(fn: (error: E) => T): T;

  /**
   * Returns the contained {@link Ok} value.
   *
   * @param message - The message to include in the error if the result is an {@link Err}.
   * @throws {Error} if the value is an {@link Err}.
   */
  expect(message: string): T;

  /**
   * Returns the contained {@link Err} value.
   *
   * @param message - The message to include in the error if the result is an {@link Ok}.
   * @throws {Error} if the value is an {@link Ok}.
   */
  expectErr(message: string): E;

  /**
   * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a contained {@link Ok} value,
   * leaving an {@link Err} value untouched.
   */
  map<U>(fn: (value: T) => U): Result<U, E>;

  /**
   * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a contained {@link Err} value,
   * leaving an {@link Ok} value untouched.
   */
  mapErr<F>(fn: (error: E) => F): Result<T, F>;

  /**
   * Returns the provided result if this result is {@link Ok},
   * otherwise returns the {@link Err} value of this result.
   *
   * This is useful for chaining operations that might fail. The error type of the
   * returned Result will be a union of the original error type and the new error type.
   *
   * @example
   * ```ts
   * const r1: Result<number, string> = ok(1);
   * const r2 = r1.flatMap(x => {
   *   if (x > 0) return ok(x * 2);
   *   return err(new Error("invalid"));
   * });
   * // r2 is Result<number, string | Error>
   * ```
   */
  flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F>;

  /**
   * Returns `other` if the result is {@link Ok}, otherwise returns the {@link Err} value of self.
   */
  and<U>(other: Result<U, E>): Result<U, E>;

  /**
   * Returns `other` if the result is {@link Err}, otherwise returns the {@link Ok} value of self.
   */
  or(other: Result<T, E>): Result<T, E>;

  /**
   * Pattern matches on the result.
   */
  match<U>(pattern: { ok: (value: T) => U; err: (error: E) => U }): U;

  /**
   * Iterator support for generator functions.
   */
  [Symbol.iterator](): Generator<Err<T, E>, T, unknown>;
}

/**
 * Contains the success value.
 */
export class Ok<T, E> implements ResultMethods<T, E> {
  readonly _tag = "Ok" as const;

  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  ok(): boolean {
    return true;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(_fn: (error: E) => T): T {
    return this.value;
  }

  expect(_message: string): T {
    return this.value;
  }

  expectErr(message: string): E {
    throw new Error(message);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }

  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return new Ok(this.value);
  }

  flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return fn(this.value);
  }

  and<U>(other: Result<U, E>): Result<U, E> {
    return other;
  }

  or(_other: Result<T, E>): Result<T, E> {
    return this;
  }

  match<U>(pattern: { ok: (value: T) => U; err: (error: E) => U }): U {
    return pattern.ok(this.value);
  }

  *[Symbol.iterator](): Generator<Err<T, E>, T, unknown> {
    return this.value;
  }
}

/**
 * Contains the error value.
 */
export class Err<T, E> implements ResultMethods<T, E> {
  readonly _tag = "Err" as const;

  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  ok(): boolean {
    return false;
  }

  unwrap(): T {
    throw new Error(
      `Called unwrap on an Err value: ${JSON.stringify(this.error)}`
    );
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this.error);
  }

  expect(message: string): T {
    throw new Error(`${message}: ${JSON.stringify(this.error)}`);
  }

  expectErr(_message: string): E {
    return this.error;
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err(this.error);
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err(fn(this.error));
  }

  flatMap<U, F>(_fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return new Err<U, E | F>(this.error);
  }

  and<U>(_other: Result<U, E>): Result<U, E> {
    return new Err(this.error);
  }

  or(other: Result<T, E>): Result<T, E> {
    return other;
  }

  match<U>(pattern: { ok: (value: T) => U; err: (error: E) => U }): U {
    return pattern.err(this.error);
  }

  *[Symbol.iterator](): Generator<Err<T, E>, T, unknown> {
    return (yield this) as T;
  }
}

export const ResultFactory = {
  /**
   * Creates an {@link Ok} result.
   */
  ok: <T, E = never>(value: T): Result<T, E> => new Ok(value),

  /**
   * Creates an {@link Err} result.
   */
  err: <T = never, E = unknown>(error: E): Result<T, E> => new Err(error),

  /**
   * Executes a function and captures any thrown errors as {@link Err}.
   */
  fromThrowable: <T, E = Error>(fn: () => T): Result<T, E> => {
    try {
      return new Ok(fn());
    } catch (error) {
      return new Err(error as E);
    }
  },

  /**
   * Converts a Promise to a {@link Result}.
   */
  fromPromise: async <T, E = Error>(
    promise: Promise<T>
  ): Promise<Result<T, E>> => {
    try {
      const value = await promise;
      return new Ok(value);
    } catch (error) {
      return new Err(error as E);
    }
  },

  /**
   * Generator function wrapper for imperative-style error handling.
   */
  gen: <T, E, Args extends unknown[]>(
    generatorFn: (
      ...args: Args
    ) => Generator<Result<unknown, E>, Result<T, E>, unknown>
  ) => {
    return (...args: Args): Result<T, E> => {
      const generator = generatorFn(...args);
      let next = generator.next();

      while (!next.done) {
        const result = next.value;

        if (result instanceof Err) {
          return result as unknown as Result<T, E>;
        }
        next = generator.next((result as Ok<unknown, E>).value);
      }

      return next.value;
    };
  },

  /**
   * Retries a promise-based operation with configurable backoff.
   */
  tryPromise: async <T, E = Error>(config: {
    try: () => Promise<T>;
    catch?: (error: unknown) => E;
    retry?: {
      times: number;
      delayMs: number;
      backoff?: "linear" | "exponential";
    };
  }): Promise<Result<T, E>> => {
    const { try: tryFn, catch: catchFn, retry } = config;
    const maxAttempts = retry ? retry.times + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const value = await tryFn();
        return new Ok(value);
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts - 1;

        if (isLastAttempt) {
          const mappedError = catchFn ? catchFn(error) : (error as E);
          return new Err(mappedError);
        }

        if (retry) {
          const delay =
            retry.backoff === "exponential"
              ? retry.delayMs * Math.pow(2, attempt)
              : retry.delayMs;

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return new Err(new Error("Unexpected retry error") as E);
  },

  /**
   * Combines an array of Results into a single Result containing an array of values.
   * Returns the first error encountered if any.
   */
  all: <T, E>(results: Result<T, E>[]): Result<T[], E> => {
    const values: T[] = [];

    for (const result of results) {
      if (result.isErr()) {
        return result as Result<T[], E>;
      }
      values.push(result.value);
    }

    return new Ok(values);
  },

  /**
   * Separates a list of Results into success values and errors.
   */
  partition: <T, E>(results: Result<T, E>[]): { ok: T[]; err: E[] } => {
    const okValues: T[] = [];
    const errValues: E[] = [];

    for (const result of results) {
      if (result.isOk()) {
        okValues.push(result.value);
      } else {
        errValues.push(result.error);
      }
    }

    return { ok: okValues, err: errValues };
  },
};
