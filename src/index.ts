import { OptionFactory } from "./option";
import { ResultFactory } from "./result";

export { type Option, Some, None, OptionFactory } from "./option";
export { type Result, Ok, Err, ResultFactory } from "./result";

export const { some, none, fromNullable } = OptionFactory;
export const {
  ok,
  err,
  fromThrowable,
  fromPromise,
  gen,
  tryPromise,
  all,
  partition,
} = ResultFactory;
