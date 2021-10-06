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
