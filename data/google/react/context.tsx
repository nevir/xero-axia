import * as react from 'react'

import { newLogger } from '../../../lib/log'

import { GoogleAPI, loadGoogleAPI } from '../api'

const moduleLog = newLogger('[google.react.context]')

// Google API

export const GoogleAPIContext = react.createContext<GoogleAPI | undefined>(
  undefined,
)

interface WithGoogleAPIProps {
  clientId: string
  apiKey: string
  discoveryDocs: string[]
  scopes: string[]
  children: JSX.Element
}

/**
 * Loads the Google API and any specific services you need.
 *
 * This must be instantiated once per application, and before calling
 * useGoogleAPI.
 */
export const WithGoogleAPI = (props: WithGoogleAPIProps) => {
  const [api, setApi] = react.useState<GoogleAPI>()

  react.useEffect(() => {
    const log = moduleLog.child('{WithGoogleAPI}')
    log.debug('loading API')

    loadGoogleAPI(props)
      .then((api) => {
        log.debug('providing context:', api)
        setApi(api)
      })
      .catch((error) => {
        log.error('error loading Google API:', error)
      })
  }, [true])

  return (
    <GoogleAPIContext.Provider value={api}>
      {props.children}
    </GoogleAPIContext.Provider>
  )
}
