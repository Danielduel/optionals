import { Err, Ok, type Result } from "./result.ts";

/**
 * The primitive None value.
 *
 * _Note: To construct a None variant Option, please use `None()` instead._
 */
export const none = Symbol("None");
type None = typeof none;
type UnwrapOption<O> = O extends Option<infer Inner> ? Inner : O;

/**
 * A Rust-like Option class.
 *
 * _Note: Please use either `Some` or `None` to construct an Option._
 *
 * @example
 * ```
 * function divide(left: number, right: number): Option<number> {
 *   if (right === 0) return None();
 *
 *   return Some(left / right);
 * }
 *
 * ```
 */
export class Option<
  Some,
  Defined = false,
  PossibleTypes = Defined extends false ? Some | None : Some,
> {
  private val: PossibleTypes;

  /**
   * A constructor for an Option.
   *
   * _Note: Please use either `Some` or `None` to construct Options._
   *
   * @param {Some | None} input The value to wrap in an Option.
   */
  constructor(input: PossibleTypes) {
    this.val = input;
  }

  /**
   * Converts Option into a String for display purposes.
   */
  get [Symbol.toStringTag]() {
    return "Option";
  }

  /**
   * Iterator support for Option.
   *
   * _Note: This method will only yeild if the Option is Some._
   * @returns {IterableIterator<Some>}
   */
  *[Symbol.iterator](): IterableIterator<Some> {
    if (this.isSome()) {
      yield this.val;
    }
  }

  /**
   * Returns true if contained value isnt None.
   * @returns {boolean}
   */
  isSome(): this is Option<Some, true> {
    return this.val !== none;
  }

  /**
   * Returns true if contained value is None.
   *
   * @returns {boolean}
   */
  isNone(): this is Option<None, true> {
    return this.val === none;
  }

  /**
   * Returns the contained Some value, consuming the Option.
   * Throws an Error with a given message if the contained value is None.
   *
   * @param {string} msg An error message to throw if contained value is None.
   * @returns {Some}
   */
  expect(msg: string): Some {
    if (this.isSome()) {
      return this.val;
    }

    throw new Error(msg);
  }

  /**
   * Returns the contained Some value, consuming the Option.
   * Throws an Error if contained value is None.
   *
   * @returns {Some}
   */
  unwrap(): Some {
    if (this.isSome()) {
      return this.val;
    }

    throw new Error(`Unwrap called on None`);
  }

  /**
   * Returns the contained Some value or a provided default.
   *
   * @param {Some} fallback A default value to return if contained value is an Option.
   * @returns {Some}
   */
  unwrapOr(fallback: Some): Some {
    if (this.isSome()) {
      return this.val;
    }

    return fallback;
  }

  /**
   * Returns the contained Some value or computes it from a closure.
   *
   * @param {Function} fn A function that computes a new value.
   * @returns {Some}
   */
  unwrapOrElse(fn: () => Some): Some {
    if (this.isSome()) {
      return this.val;
    }

    return fn();
  }

  /**
   * Maps an Option<T> to Option<U> by applying a function to a contained Some value, leaving None values untouched.
   *
   * @param {Function} fn A mapping function.
   * @returns {Option<U>}
   */
  map<U>(fn: (input: Some) => U): Option<U> | Option<None, true> {
    if (this.isSome()) {
      return new Option<U>(fn(this.val));
    }

    if (this.isNone()) {
      return this;
    }

    return this as Option<None, true> // TODO remove this;
  }

  /**
   * Returns the provided fallback (if None), or applies a function to the contained value.
   *
   * @param {U} fallback A defualt value
   * @param {Function} fn A mapping function.
   * @returns {U}
   */
  mapOr<U>(fallback: U, fn: (input: Some) => U): U {
    if (this.isSome()) {
      return fn(this.val);
    }

    return fallback;
  }

  /**
   * Returns `or` if the Option is None, otherwise returns self.
   *
   * @param {Option<Some>} or An alternative Option value
   * @returns {Option<Some>}
   */
  or(or: Option<Some>): Option<Some> {
    if (this.isSome()) {
      return this;
    }

    return or;
  }

  /**
   * Transforms the `Option<T>` into a `Result<T, E>`, mapping Some to Ok and None to Err.
   *
   * @param {E} err An error to return if the Option is None.
   * @returns {Result<Some, E>}
   *
   * @example
   * ```
   * const result = Some(2).okOr("Error"); // => Ok(2)
   * ```
   */
  okOr<E extends Error>(err: E | string): Result<Some, E> {
    if (this.isSome()) {
      return Ok(this.val);
    } else {
      return Err(err);
    }
  }

  /**
   * Returns contained value for use in matching.
   *
   * _Note: Please only use this to match against in `if` or `swtich` statments._
   *
   * @returns {PossibleTypes}
   * @example
   * ```ts
   * function coolOrNice(input: Option<string>): Option<void> {
   *   switch (input.peek()) {
   *     case "cool":
   *       console.log("Input was the coolest!");
   *       break;
   *     case "nice":
   *       console.log("Input was was the nicest!");
   *       break
   *     default:
   *       return None();
   *   }
   *   return Some()
   * }
   * ```
   */
  peek(): PossibleTypes {
    return this.val;
  }

  isInnerOption(): this is Option<Option<UnwrapOption<PossibleTypes>>> {
    return this.val instanceof Option;
  }

  /**
   * Converts from Option<Option<T>> to Option<T>
   * @returns Option<T>
   */
  flatten(): Option<UnwrapOption<PossibleTypes>> {
    // TODO remove these "as"
    if (this.isInnerOption()) {
      return this.val as Option<UnwrapOption<PossibleTypes>>;
    }
    return this as Option<UnwrapOption<PossibleTypes>>;
  }

  /**
   * Run a closure and convert it into an Option.
   * If the function returns `null` or `undefined`, an Option containing None will be reutrned.
   *
   * _Note: Please use `fromAsync` to capture the result of asynchronous closures._
   * @param {Function} fn The closure to run.
   * @returns {Option<T>} The result of the closure.
   */
  static from<T>(fn: () => T | null | undefined): Option<T> {
    const result = fn();
    if (result === null || result === undefined) {
      return new Option<T>(none);
    } else {
      return new Option<T>(result);
    }
  }

  /**
   * Run an asynchronous closure and convert it into an Option.
   * If the function returns `null` or `undefined`, an Option containing None will be reutrned.
   *
   * _Note: Please use `from` to capture the result of synchronous closures._
   * @param {Function} fn The closure to run.
   * @returns {Promise<Option<T>>} The result of the closure.
   */
  static async fromAsync<T>(
    fn: () => Promise<T | null | undefined>,
  ): Promise<Option<T>> {
    const result = await fn();
    if (result === null || result === undefined) {
      return new Option<T>(none);
    } else {
      return new Option<T>(result);
    }
  }
}

/**
 * Construct an Option from a value other than None.
 *
 * @param {Exclude<T, typeof none>} input a value that isnt None.
 * @returns {Option<T>}
 * @example
 * ```ts
 * function divide(left: number, right: number): Option<number> {
 *   if (right === 0) return None();
 *
 *   return Some(left / right);
 * }
 *
 * ```
 *
 * @example
 * ```ts
 * const foo = Some("Value");
 *
 * if (foo instanceof Some) {
 *  // Do something
 * }
 * ```
 */
export function Some<T>(input: T): Option<T> {
  return new Option<T>(input as T);
}

Object.defineProperty(Some, Symbol.hasInstance, {
  value: <T>(instance: Option<T>): boolean => {
    if (typeof instance !== "object") return false;
    return instance?.isSome() || false;
  },
});

/**
 * Construct the None variant of Option.
 *
 * @returns {Option<T>}
 * @example
 * ```ts
 *  function divide(left: number, right: number): Option<number> {
 *   if (right === 0) return None();
 *
 *   return Some(left / right);
 * }
 * ```
 * @example
 * ```ts
 * const foo = None();
 *
 * if (foo instanceof None) {
 *  // Do something
 * }
 * ```
 */
export function None<T>(): Option<T> {
  return new Option<T>(none);
}

Object.defineProperty(None, Symbol.hasInstance, {
  value: <T>(instance: Option<T>): boolean => {
    if (typeof instance !== "object") return false;
    return instance?.isNone() || false;
  },
});
