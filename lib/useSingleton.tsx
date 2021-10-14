import * as react from 'react'

import { newLazyPromise } from './util/async'

export interface SingletonHook<TValue = unknown> {
  (): TValue | undefined
  resolve: PromiseLike<TValue>
}

export function singletonHook<TValue>(
  factory: (update: (newValue: TValue) => void) => PromiseLike<TValue>,
  dependencies?: SingletonHook[],
): SingletonHook<TValue> {
  let singleton: TValue | undefined
  const hookUpdaters = new Set<(newValue: TValue) => void>()

  const useSingleton = (() => {
    const [hookSingleton, setHookSingleton] = react.useState(singleton)

    react.useEffect(() => {
      hookUpdaters.add(setHookSingleton)

      useSingleton.resolve.then(
        (s) => setHookSingleton(s),
        () => {},
      )

      return () => {
        hookUpdaters.delete(setHookSingleton)
      }
    }, [true])

    return hookSingleton
  }) as SingletonHook<TValue>

  const updateAllHooks = (newValue: TValue) => {
    singleton = newValue
    hookUpdaters.forEach((u) => u(newValue))
    useSingleton.resolve = Promise.resolve(newValue)
  }

  useSingleton.resolve = newLazyPromise<TValue>((resolve, reject) => {
    factory(updateAllHooks).then(
      (value) => {
        singleton = value
        resolve(value)
      },
      (error) => {
        console.error('failed to retrieve initial value for singleton:', error)
        reject(error)
      },
    )
  })

  return useSingleton
}
