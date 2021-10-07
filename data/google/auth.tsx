import * as react from 'react'
import { newLogger } from '../../lib/log'

import { useGoogleAPI, GoogleAPI, loadGoogleAPIModule } from './api'

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
    const log = newLogger('[Google API]', '{useGoogleAuthAPI}')
    const config = {}
    log.debug('initializing')
    const authInstance = api.auth2.getAuthInstance()
    if (authInstance) {
      log.debug('using pre-initialized instance')
      whenAuthAPIInitialized = Promise.resolve(authInstance)
    } else {
      whenAuthAPIInitialized = new Promise(async (resolve, reject) => {
        await loadGoogleAPIModule('auth2')

        api.auth2
          .init(config)
          .then((authApi) => {
            log.debug('initialized', authApi)
            resolve(authApi)
          })
          .catch((error: any) => {
            log.error('initialization error:', error)
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
      state: 'initializing' | 'idle' | 'signing-in' | 'canceled'
    }
  | { state: 'signed-in'; user: gapi.auth2.GoogleUser }
  | { state: 'error'; error: any }

export interface WithGoogleUserResult {
  state: WithGoogleUserState['state']
  user?: gapi.auth2.GoogleUser
  error?: any
  signIn?: (options?: gapi.auth2.SigninOptions) => void
  signOut?: () => void
}

/**
 *
 */
export function useGoogleUser(): WithGoogleUserResult {
  const api = useGoogleAuthAPI()
  const [state, setState] = react.useState<WithGoogleUserState>({
    state: 'initializing',
  })

  if (!api) return { ...state }

  if (state.state === 'initializing') {
    setState({ state: 'idle' })
  }

  const currentUser = api.currentUser.get()
  if (state.state === 'idle' && currentUser?.isSignedIn()) {
    setState({ state: 'signed-in', user: currentUser })
  }

  function signIn(options?: gapi.auth2.SigninOptions) {
    console.debug('[Google API] auth signIn')
    if (state.state === 'signed-in') {
      throw new Error(`Already signed in. Sign out first`)
    }
    if (state.state === 'signing-in') {
      console.warn('Currently signing in; ignoring')
      return
    }

    console.debug('[Google API] signing in', options)
    setState({ state: 'signing-in' })

    api!
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

  function signOut() {
    console.debug('[Google API] auth signOut')
    api!.signOut()
    setState({ state: 'idle' })
  }

  return { ...state, signIn, signOut }
}
