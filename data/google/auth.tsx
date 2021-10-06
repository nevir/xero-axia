import * as react from 'react'

import { useGoogleAPI, GoogleAPI } from './api'

export type GoogleAuthAPI = InstanceType<GoogleAPI['auth2']['GoogleAuth']>

/**
 *
 */
let whenAuthAPIInitialized: Promise<GoogleAuthAPI> | undefined
/**
 *
 */
export function useGoogleAuthAPI() {
  const api = useGoogleAPI()
  const [authApi, setAuthApi] = react.useState<GoogleAuthAPI>()
  if (!api) return

  if (!whenAuthAPIInitialized) {
    const config = {}
    console.debug('[Google API] initializing auth2')
    const authInstance = api.auth2.getAuthInstance()
    if (authInstance) {
      console.debug('[Google API] using pre-initialized instance')
      whenAuthAPIInitialized = Promise.resolve(authInstance)
    } else {
      whenAuthAPIInitialized = new Promise((resolve, reject) => {
        api.auth2
          .init(config)
          .then((authApi) => {
            console.debug('[Google API] auth2 initialized', authApi)
            resolve(authApi)
          })
          .catch((error: any) => {
            console.error('[Google API] failed to initialize auth API', error)
            reject(error)
          })
      })
    }
  }

  whenAuthAPIInitialized.then((a) => setAuthApi(a)).catch(() => {})

  return authApi
}

export type WithGoogleUserState =
  | {
      state: 'idle' | 'signing-in' | 'canceled'
      user?: undefined
      error?: undefined
    }
  | { state: 'signed-in'; user: gapi.auth2.GoogleUser }
  | { state: 'error'; user?: undefined; error: any }

/**
 *
 */
export function useGoogleUser() {
  const api = useGoogleAuthAPI()
  const [state, setState] = react.useState<WithGoogleUserState>({
    state: 'idle',
  })

  function signIn(options?: gapi.auth2.SigninOptions) {
    console.debug('[Google API] auth signIn')
    if (state.state === 'signed-in') {
      throw new Error(`Already signed in. Sign out first`)
    }
    if (state.state === 'signing-in') {
      console.warn('Currently signing in; ignoring')
      return
    }
    if (!api) return

    console.debug('[Google API] signing in', options)
    setState({ state: 'signing-in' })

    api
      .signIn(options)
      .then((user) => {
        console.debug('[Google API] signed in', user)
        setState({ state: 'signed-in', user })
      })
      .catch((error) => {
        if (error.error === 'popup_closed_by_user') {
          console.debug('[Google API] user canceled sign in', error)
          setState({ state: 'canceled' })
        } else {
          console.warn('[Google API] failed to sign in', error)
          setState({ state: 'error', error })
        }
      })
  }

  return { ...state, signIn }
}
