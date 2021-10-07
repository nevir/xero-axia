import * as react from 'react'

import { newLazyPromise } from './util/async'

export interface SingletonHook<TValue> {
  (): TValue | undefined
  resolve: PromiseLike<TValue>
}

export interface SingletonHookOptions<TValue> {
  factory: () => PromiseLike<TValue>
}

export function singletonHook<TValue>({
  factory,
}: SingletonHookOptions<TValue>): SingletonHook<TValue> {
  let singleton: TValue | undefined
  const resolveSingleton = newLazyPromise<TValue>((resolve, reject) => {
    factory().then(
      (value) => {
        singleton = value
        resolve(value)
      },
      (error) => {
        console.error(error)
        reject(error)
      },
    )
  })

  const useSingleton = (() => {
    const [hookSingleton, setHookSingleton] = react.useState(singleton)
    resolveSingleton.then(
      (s) => setHookSingleton(s),
      () => {},
    )

    return hookSingleton
  }) as SingletonHook<TValue>
  useSingleton.resolve = resolveSingleton

  return useSingleton
}
