import * as react from 'react'

import { GoogleAPI, newModuleHook } from './api'

export type GoogleAuthAPI = InstanceType<GoogleAPI['auth2']['GoogleAuth']>

export const useGoogleAuthAPI = newModuleHook<GoogleAuthAPI>({
  moduleName: 'auth2',
  getPreInit: (api) => api.auth2.getAuthInstance(),
  init: async (api) => {
    return await (api.auth2.init as any)()
  },
})

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
