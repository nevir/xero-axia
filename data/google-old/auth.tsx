import * as react from 'react'

import { newLogger } from '../../lib/log'
import { singletonHook } from '../../lib/useSingleton'

import { GoogleAPI, moduleHook } from './api'

export type GoogleAuthAPI = InstanceType<GoogleAPI['auth2']['GoogleAuth']>

export const useGoogleAuthAPI = moduleHook<GoogleAuthAPI>({
  name: 'auth2',
  preload: (api) => api.auth2.getAuthInstance(),
  resolve: async (api) => {
    return await (api.auth2.init as any)()
  },
})

export const useCurrentGoogleUser = singletonHook(async () => {
  // const authApi = await useGoogleAuthAPI.resolve
})

// export type WithGoogleUserState =
//   | {
//       state: 'initializing' | 'idle' | 'signing-in' | 'canceled'
//     }
//   | { state: 'signed-in'; user: gapi.auth2.GoogleUser }
//   | { state: 'error'; error: any }

// export interface WithGoogleUserResult {
//   state: WithGoogleUserState['state']
//   user?: gapi.auth2.GoogleUser
//   error?: any
//   signIn?: (options?: gapi.auth2.SigninOptions) => void
//   signOut?: () => void
// }

// /**
//  *
//  */
// export function useGoogleUser(): WithGoogleUserResult {
//   const log = react.useMemo(
//     () => newLogger('[Google API]', '{useGoogleUser}'),
//     [true],
//   )
//   const api = useGoogleAuthAPI()
//   const [state, setState] = react.useState<WithGoogleUserState>({
//     state: 'initializing',
//   })

//   if (!api) return { ...state }

//   if (state.state === 'initializing') {
//     setState({ state: 'idle' })
//   }

//   const currentUser = api.currentUser.get()
//   if (state.state === 'idle' && currentUser?.isSignedIn()) {
//     setState({ state: 'signed-in', user: currentUser })
//   }

//   function signIn(options?: gapi.auth2.SigninOptions) {
//     log.debug('signIn')
//     if (state.state === 'signed-in') {
//       throw new Error(`Already signed in. Sign out first`)
//     }
//     if (state.state === 'signing-in') {
//       log.warn('Currently signing in; ignoring')
//       return
//     }

//     log.debug('signing in', options)
//     setState({ state: 'signing-in' })

//     api!
//       .signIn(options)
//       .then((user) => {
//         log.debug('signed in', user)
//         setState({ state: 'signed-in', user })
//       })
//       .catch((error) => {
//         if (error.error === 'popup_closed_by_user') {
//           log.debug('user canceled sign in', error)
//           setState({ state: 'canceled' })
//         } else {
//           log.warn('failed to sign in', error)
//           setState({ state: 'error', error })
//         }
//       })
//   }

//   function signOut() {
//     log.debug('signOut')
//     api!.signOut()
//     setState({ state: 'idle' })
//   }

//   return { ...state, signIn, signOut }
// }
