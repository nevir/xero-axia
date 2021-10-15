import * as react from 'react'

import { newLogger } from '../../../lib/log'

import { GoogleAuth, GoogleAuthState, User } from '../auth'

import { GoogleAPIContext } from '.'

const moduleLog = newLogger('[google.react.auth]   ')

export const GoogleAuthAPIContext = react.createContext<GoogleAuth | undefined>(
  undefined,
)

/**
 * Loads the Google Auth API.
 */
export const WithGoogleAuthAPI = (props: { children: JSX.Element }) => {
  const api = react.useContext(GoogleAPIContext)
  const [auth, setAuth] = react.useState<GoogleAuth>()

  react.useEffect(() => {
    if (!api) return

    const log = moduleLog.child('{WithGoogleAuthAPI}')
    log.debug('loading Auth API')

    GoogleAuth.load(api)
      .then((auth) => {
        log.debug('providing context:', auth)
        setAuth(auth)
      })
      .catch((error) => {
        log.error('error loading Google Auth API:', error)
      })
  }, [api])

  return (
    <GoogleAuthAPIContext.Provider value={auth}>
      {props.children}
    </GoogleAuthAPIContext.Provider>
  )
}

export interface CurrentGoogleUserValue {
  user: User | undefined
  state: GoogleAuthState | 'initializing'
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Provides the current user.
 */
export function useCurrentGoogleUser(): CurrentGoogleUserValue {
  const auth = react.useContext(GoogleAuthAPIContext)
  const [value, setValue] = react.useState({
    user: auth?.user,
    state: auth?.state || 'initializing',
  } as const)

  react.useEffect(() => {
    if (!auth) return
    return auth.onStatusChanged((user, state) => {
      setValue({ user, state })
    })
  }, [auth])

  return {
    ...value,
    signIn: () => auth!.signIn(),
    signOut: () => auth!.signOut(),
  }
}
