import * as react from 'react'

import { newLogger } from '../../../lib/log'

import { GoogleAuth } from '../auth'

import { GoogleAPIContext } from '.'

const moduleLog = newLogger('[google.react.auth]')

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

export function useCurrentGoogleUser() {
  const auth = react.useContext(GoogleAuthAPIContext)
  const [user, setUser] = react.useState(auth?.getCurrentUser())
  react.useEffect(() => {
    if (!auth) return
    return auth.onCurrentUserChanged(setUser)
  }, [auth])

  return react.useMemo(() => {
    return {
      user,
      signIn: () => auth?.signIn(),
      state: 'idle',
    }
  }, [auth, user])
}
