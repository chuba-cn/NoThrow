# Result and Option Types

A TypeScript library for type-safe error handling, inspired by Rust's Result and Option types. Features generator-based error propagation using yield\* for automatic unwrapping, similar to Rust's ? operator.


## Features

- Type-safe error handling without exceptions
- Generator-based error propagation with yield\*
- Composable operations with map, flatMap, and more
- Async operations with automatic retry and exponential backoff
- Full TypeScript support with excellent type inference
- Zero runtime dependencies
- Comprehensive test coverage
- Production-ready

## Quick Start

### Generator Approach (Recommended)

Use Result.gen() with yield\* for automatic error propagation:

```typescript
import { ok, err, gen, Result } from "nothrow";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("Division by zero");
  return ok(a / b);
}

const calculate = gen(function* (a: number, b: number, c: number) {
  // yield* automatically unwraps Ok Values
  // and immediately returns Err values
  const sum = yield* divide(a, b);
  const result = yield* divide(sum, c);
  return ok(result * 2);
});

calculate(10, 2, 5).unwrap(); // 2
calculate(10, 0, 5).isErr(); // true
```

### Traditional Chaining

```typescript
import { ok, err } from "nothrow";

const result = divide(10, 2)
  .flatMap((x) => divide(x, 5))
  .map((x) => x * 2);

result.unwrap(); // 2
```

## API Reference

### Result Type

Result represents either success (Ok) or failure (Err).

#### Construction

```typescript
import { ok, err, fromThrowable, fromPromise } from "nothrow";

// Create Ok or Err
const success = ok(42);
const failure = err("Something went wrong");

// From throwing functions
const result = fromThrowable(() => JSON.parse(jsonString));

// From promises
const asyncResult = await fromPromise(fetch("/api/data"));
```

#### Type Guards

```typescript
result.isOk(): boolean   // Check if Ok
result.isErr(): boolean  // Check if Err
result.ok(): boolean     // Alias for isOk()
```

#### Extracting Values

```typescript
result.unwrap(): T                      // Get value or throw
result.unwrapOr(defaultValue: T): T    // Get value or default
result.unwrapOrElse((err) => T): T     // Get value or compute default
result.expect(message: string): T       // Unwrap with custom error message
result.expectErr(message: string): E    // Unwrap error or throw
```

#### Transformations

```typescript
// Transform the Ok value
result.map((value) => newValue): Result<U, E>

// Transform the Err value
result.mapErr((error) => newError): Result<T, F>

// Chain Result-returning operations
result.flatMap((value) => anotherResult): Result<U, E>
```

#### Combinators

```typescript
result.and(otherResult): Result<U, E>  // Returns other if Ok, else Err
result.or(otherResult): Result<T, E>   // Returns Ok if Ok, else other
```

#### Pattern Matching

```typescript
const output = result.match({
  ok: (value) => `Success: ${value}`,
  err: (error) => `Error: ${error}`,
});
```

### Generator-Based Error Handling

#### Result.gen()

Wrap a generator function to enable automatic error propagation:

```typescript
import { gen, ok, err } from "nothrow";

const myFunction = gen(function* (x: number) {
  const a = yield* someOperation(x);
  const b = yield* anotherOperation(a);
  const c = yield* finalOperation(b);
  return ok(c);
});
```

Benefits:

- No manual error checking
- Early returns on error automatically
- Reads like synchronous code
- Type-safe throughout

#### Result.tryPromise()

Handle async operations with automatic retry:

```typescript
import { tryPromise } from "nothrow";

const result = await tryPromise({
  try: async () => {
    const response = await fetch("/api/data");
    return response.json();
  },
  catch: (error) => ({
    type: "NETWORK_ERROR",
    message: error.message,
  }),
  retry: {
    times: 3,
    delayMs: 200,
    backoff: "exponential", // 200ms, 400ms, 800ms
  },
});
```

#### Result.all()

Convert an array of Results into a Result of an array:

```typescript
import { ok, err, all } from "nothrow";

const results = [ok(1), ok(2), ok(3)];
const combined = all(results);
combined.unwrap(); // [1, 2, 3]

const withError = [ok(1), err("failed"), ok(3)];
all(withError).isErr(); // true
```

#### Result.partition()

Split an array of Results into successes and failures:

```typescript
import { ok, err, partition } from "nothrow";

const results = [ok(1), err("e1"), ok(2), err("e2")];
const { ok: successes, err: failures } = partition(results);

console.log(successes); // [1, 2]
console.log(failures); // ['e1', 'e2']
```

### Option Type

Option represents an optional value: Some or None.

#### Construction

```typescript
import { some, none, fromNullable } from "nothrow";

const value = some(42);
const empty = none<number>();
const maybeValue = fromNullable(possiblyNull);
```

#### Type Guards

```typescript
option.isSome(): boolean  // Check if Some
option.isNone(): boolean  // Check if None
```

#### Extracting Values

```typescript
option.unwrap(): T                      // Get value or throw
option.unwrapOr(defaultValue: T): T    // Get value or default
option.unwrapOrElse(() => T): T        // Get value or compute default
option.expect(message: string): T       // Unwrap with custom error message
```

#### Transformations

```typescript
option.map((value) => newValue): Option<U>
option.flatMap((value) => anotherOption): Option<U>
option.filter((value) => boolean): Option<T>
```

#### Conversion to Result

```typescript
option.okOr(error): Result<T, E>
option.okOrElse(() => error): Result<T, E>
```

#### Pattern Matching

```typescript
const output = option.match({
  some: (value) => `Value: ${value}`,
  none: () => "No value",
});
```

## Examples

### User Registration Flow

```typescript
import { ok, err, gen, Result } from "nothrow";

interface User {
  email: string;
  age: number;
  username: string;
}

type ValidationError =
  | { type: "INVALID_EMAIL"; message: string }
  | { type: "INVALID_AGE"; message: string }
  | { type: "USERNAME_TAKEN"; message: string };

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes("@")) {
    return err({ type: "INVALID_EMAIL", message: "Must contain @" });
  }
  return ok(email);
}

function validateAge(age: number): Result<number, ValidationError> {
  if (age < 13) {
    return err({ type: "INVALID_AGE", message: "Must be 13 or older" });
  }
  return ok(age);
}

function checkUsernameAvailable(
  username: string
): Result<string, ValidationError> {
  if (username === "admin") {
    return err({ type: "USERNAME_TAKEN", message: "Username taken" });
  }
  return ok(username);
}

const registerUser = gen(function* (
  email: string,
  age: number,
  username: string
) {
  const validEmail = yield* validateEmail(email);
  const validAge = yield* validateAge(age);
  const validUsername = yield* checkUsernameAvailable(username);

  return ok({
    email: validEmail,
    age: validAge,
    username: validUsername,
  });
});

// Usage
const user = registerUser("alice@example.com", 25, "alice");
user.match({
  ok: (u) => console.log("Registered:", u),
  err: (e) => console.error("Error:", e.message),
});
```

### API Request with Error Handling

```typescript
import { tryPromise, Result } from "nothrow";

interface ApiError {
  type: "NETWORK" | "HTTP" | "PARSE";
  status?: number;
  message: string;
}

async function fetchUser(id: string): Promise<Result<User, ApiError>> {
  return tryPromise<User, ApiError>({
    try: async () => {
      const response = await fetch(`/api/users/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    },
    catch: (error) => {
      if ((error as Error).message.includes("HTTP")) {
        return {
          type: "HTTP",
          status: parseInt((error as Error).message.split(" ")[1]),
          message: "Request failed",
        };
      }
      return {
        type: "NETWORK",
        message: (error as Error).message,
      };
    },
    retry: {
      times: 3,
      delayMs: 1000,
      backoff: "exponential",
    },
  });
}
```

### Database Transaction

```typescript
import { gen, ok, err, Result } from "nothrow";

interface DBError {
  type: "NOT_FOUND" | "CONSTRAINT_VIOLATION" | "CONNECTION_ERROR";
  message: string;
}

const transferMoney = gen(function* (
  fromAccount: string,
  toAccount: string,
  amount: number
) {
  const fromUser = yield* findAccount(fromAccount);

  if (fromUser.balance < amount) {
    return err({
      type: "CONSTRAINT_VIOLATION",
      message: "Insufficient funds",
    });
  }

  const toUser = yield* findAccount(toAccount);

  yield* updateBalance(fromAccount, fromUser.balance - amount);
  yield* updateBalance(toAccount, toUser.balance + amount);
  yield* logTransaction({ from: fromAccount, to: toAccount, amount });

  return ok(undefined);
});
```

### Form Validation Pipeline

```typescript
import { ok, err, gen, all } from "nothrow";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const validateForm = gen(function* (data: FormData) {
  const validations = [
    validateUsername(data.username),
    validateEmail(data.email),
    validatePassword(data.password),
  ];

  yield* all(validations);

  if (data.password !== data.confirmPassword) {
    return err("Passwords do not match");
  }

  return ok(data);
});
```

## Migration from try-catch

Before:

```typescript
async function fetchAndProcess(id: string) {
  try {
    const response = await fetch(`/api/data/${id}`);
    const data = await response.json();
    return processData(data);
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
```

After:

```typescript
const fetchAndProcess = gen(function* (id: string) {
  const response = yield* tryPromise({
    try: () => fetch(`/api/data/${id}`).then((r) => r.json()),
  });

  const processed = yield* processData(response);
  return ok(processed);
});

const result = await fetchAndProcess("123");
result.match({
  ok: (data) => handleSuccess(data),
  err: (error) => handleError(error),
});
```

## Best Practices

1. Use generators for sequential operations with multiple steps
2. Use traditional chaining for simple transformations
3. Define error types explicitly using discriminated unions
4. Handle all error cases using match()
5. Choose one error handling style per function for consistency

## TypeScript Tips

### Discriminated Union Errors

```typescript
type AppError =
  | { type: "VALIDATION"; field: string; message: string }
  | { type: "NETWORK"; status: number }
  | { type: "AUTH"; reason: "EXPIRED" | "INVALID" };

function handleError(error: AppError) {
  switch (error.type) {
    case "VALIDATION":
      return `${error.field}: ${error.message}`;
    case "NETWORK":
      return `HTTP ${error.status}`;
    case "AUTH":
      return `Auth failed: ${error.reason}`;
  }
}
```

### Generic Error Helpers

```typescript
function wrapError<T, E>(
  fn: () => T,
  errorMapper: (e: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (e) {
    return err(errorMapper(e));
  }
}
```

## License

MIT

## Contributing

Contributions are welcome. Please ensure all tests pass and add tests for new features.

```bash
npm install
npm test
npm run lint
npm run build
```
