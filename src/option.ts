import { Ok, Err, type Result } from "./result";

/**
 * Option represents an optional value: every Option is either Some and contains a value, or None, and does not.
 */
export type Option<T> = Some<T> | None;

interface OptionMethods<T> {
  /**
   * Returns `true` if the option is a {@link Some} value.
   */
  isSome(): this is Some<T>;

  /**
   * Returns `true` if the option is a {@link None} value.
   */
  isNone(): this is None;

  /**
   * Returns the contained {@link Some} value.
   *
   * @throws {Error} if the value is a {@link None}.
   */
  unwrap(): T;

  /**
   * Returns the contained {@link Some} value or a provided default.
   */
  unwrapOr(defaultValue: T): T;

  /**
   * Returns the contained {@link Some} value or computes it from a closure.
   */
  unwrapOrElse(fn: () => T): T;

  /**
   * Returns the contained {@link Some} value.
   *
   * @param message - The message to include in the error if the value is a {@link None}.
   * @throws {Error} if the value is a {@link None}.
   */
  expect(message: string): T;

  /**
   * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value.
   */
  map<U>(fn: (value: T) => U): Option<U>;

  /**
   * Returns the provided option if this option is {@link Some}, otherwise returns {@link None}.
   */
  flatMap<U>(fn: (value: T) => Option<U>): Option<U>;

  /**
   * Returns {@link None} if the option is {@link None}, otherwise calls `predicate` with the wrapped value and returns:
   * - {@link Some} if `predicate` returns `true`.
   * - {@link None} if `predicate` returns `false`.
   */
  filter(predicate: (value: T) => boolean): Option<T>;

  /**
   * Returns {@link None} if the option is {@link None}, otherwise returns `other`.
   */
  and<U>(other: Option<U>): Option<U>;

  /**
   * Returns the option if it contains a value, otherwise returns `other`.
   */
  or(other: Option<T>): Option<T>;

  /**
   * Pattern matches on the option.
   */
  match<U>(pattern: { some: (value: T) => U; none: () => U }): U;

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`, mapping {@link Some} to {@link Ok} and {@link None} to {@link Err} with the provided error.
   */
  okOr<E>(error: E): Result<T, E>;

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`, mapping {@link Some} to {@link Ok} and {@link None} to {@link Err} with the provided error function.
   */
  okOrElse<E>(errorFn: () => E): Result<T, E>;

  /**
   * Iterator support for generator functions.
   */
  [Symbol.iterator](): Generator<None, T, unknown>;
}

/**
 * Contains a value.
 */
export class Some<T> implements OptionMethods<T> {
  readonly _tag = "Some" as const;

  constructor(readonly value: T) {}

  isSome(): this is Some<T> {
    return true;
  }

  isNone(): this is None {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(_fn: () => T): T {
    return this.value;
  }

  expect(_message: string): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Option<U> {
    return new Some(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value);
  }

  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : None.instance;
  }

  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  or(_other: Option<T>): Option<T> {
    return this;
  }

  match<U>(pattern: { some: (value: T) => U; none: () => U }): U {
    return pattern.some(this.value);
  }

  okOr<E>(_error: E): Result<T, E> {
    return new Ok(this.value);
  }

  okOrElse<E>(_errorFn: () => E): Result<T, E> {
    return new Ok(this.value);
  }

  *[Symbol.iterator](): Generator<None, T, unknown> {
    return this.value;
  }
}

/**
 * Represents no value.
 */
export class None implements OptionMethods<never> {
  readonly tag = "None" as const;

  private static _instance: None;

  private constructor() {}

  static get instance(): None {
    if (!None._instance) {
      None._instance = new None();
    }
    return None._instance;
  }

  isSome(): this is Some<never> {
    return false;
  }

  isNone(): this is None {
    return true;
  }

  unwrap(): never {
    throw new Error("Called unwrap on a None value");
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse<T>(fn: () => T): T {
    return fn();
  }

  expect(message: string): never {
    throw new Error(message);
  }

  map<U>(_fn: (value: never) => U): Option<U> {
    return None.instance;
  }

  flatMap<U>(_fn: (value: never) => Option<U>): Option<U> {
    return None.instance;
  }

  filter(_predicate: (value: never) => boolean): Option<never> {
    return None.instance;
  }

  and<U>(_other: Option<U>): Option<U> {
    return None.instance;
  }

  or<T>(other: Option<T>): Option<T> {
    return other;
  }

  match<U>(pattern: { some: (value: never) => U; none: () => U }): U {
    return pattern.none();
  }

  okOr<E>(error: E): Result<never, E> {
    return new Err(error);
  }

  okOrElse<E>(errorFn: () => E): Result<never, E> {
    return new Err(errorFn());
  }

  *[Symbol.iterator](): Generator<None, never, unknown> {
    return (yield this) as never;
  }
}

export const OptionFactory = {
  /**
   * Creates a {@link Some} option.
   */
  some: <T>(value: T): Option<T> => new Some(value),

  /**
   * Creates a {@link None} option.
   */
  none: <T = never>(): Option<T> => None.instance as Option<T>,

  /**
   * Creates a {@link Some} option if the value is not null or undefined, otherwise returns {@link None}.
   */
  fromNullable: <T>(value: T | null | undefined): Option<T> =>
    value != null ? new Some(value) : (None.instance as Option<T>),
};
