export interface Deferred<TValue> extends Promise<TValue> {
  resolve(value: TValue): void
  reject(error: any): void
}

export function newDeferred<TValue>(): Deferred<TValue> {
  let resolve: any
  let reject: any
  const deferred = new Promise((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  }) as Deferred<TValue>

  deferred.resolve = resolve
  deferred.reject = reject

  return deferred
}

/**
 * Constructs a PromiseLike object that executes only when first resolved.
 */
export function newLazyPromise<TValue>(
  executor: (
    resolve: (value: TValue | PromiseLike<TValue>) => void,
    reject: (reason?: any) => void,
  ) => void,
): PromiseLike<TValue> {
  let realPromise: Promise<TValue> | undefined
  return {
    then<TFulfilled = TValue, TRejected = never>(
      onFulfilled?:
        | ((value: TValue) => TFulfilled | PromiseLike<TFulfilled>)
        | undefined
        | null,
      onRejected?:
        | ((reason: any) => TRejected | PromiseLike<TRejected>)
        | undefined
        | null,
    ): PromiseLike<TFulfilled | TRejected> {
      realPromise = new Promise(executor)
      this.then = realPromise.then.bind(realPromise)

      return this.then(onFulfilled, onRejected)
    },
  }
}
