import * as react from 'react'
import { Deferred, newDeferred } from '../../lib/util/async'

const API_URL = 'https://apis.google.com/js/api.js'
const API_LOAD_TIMEOUT = 15

export type GoogleAPI = typeof gapi

interface WithGoogleAPIProps {
  clientId: string
  apiKey: string
  discoveryDocs: string[]
  scopes: string[]
  children: JSX.Element
}

let instantiated = false
const whenGapiInitialized = newDeferred<GoogleAPI>()

/**
 * Loads the Google API and any specific services you need.
 *
 * This must be instantiated once per application, and before calling
 * useGoogleAPI.
 */
export const WithGoogleAPI = (props: WithGoogleAPIProps) => {
  instantiated = true

  react.useEffect(() => {
    whenGapiInitialized.catch((error) => {
      console.error('[Google API] error initializing:', error)
    })

    console.debug('[Google API] injecting script')
    injectScript(() => {
      loadGoogleAPIModule('client')
        .then(() => {
          const config = {
            apiKey: props.apiKey,
            discoveryDocs: props.discoveryDocs,
            clientId: props.clientId,
            scope: props.scopes.join(' '),
          }

          console.debug('[Google API] gapi.client.init', config)
          gapi.client
            .init(config)
            .then(() => {
              console.debug('[Google API] gapi.client.init success')
              whenGapiInitialized.resolve(gapi)
            })
            .catch((error) => {
              console.debug('[Google API] gapi.client.init error', error)
              whenGapiInitialized.reject(error)
            })
        })
        .catch((e) => whenGapiInitialized.reject(e))
    })
  }, [true])

  return <react.Fragment>{props.children}</react.Fragment>
}

/**
 * Loads one or more gapi modules.
 */
export async function loadGoogleAPIModule(
  ...moduleNames: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.debug('[Google API] gapi.load', ...moduleNames)
    gapi.load(moduleNames.join(':'), {
      timeout: API_LOAD_TIMEOUT * 1000,

      callback: () => {
        console.debug('[Google API] gapi.load', ...moduleNames, 'success')
        resolve()
      },

      onerror: (error: any) => {
        console.debug('[Google API] gapi.load', ...moduleNames, 'error:', error)
        const modules = moduleNames.map((m) => `'${m}'`).join(', ')
        reject(
          new Error(`Failed to load Google API Module(s) ${modules}: ${error}`),
        )
      },

      ontimeout: () => {
        console.debug('[Google API] gapi.load', ...moduleNames, 'timeout')
        const modules = moduleNames.map((m) => `'${m}'`).join(', ')
        reject(
          new Error(
            `Timed out loading Google API Module(s) ${modules} after ${API_LOAD_TIMEOUT} seconds`,
          ),
        )
      },
    })
  })
}

/**
 * Provides access to the raw Google API.
 */
export function useGoogleAPI() {
  if (!instantiated) {
    throw new Error(
      `The application must first be configured via <WithGoogleAPI … /> before calling useGoogleAPI()`,
    )
  }

  const [api, setApi] = react.useState<GoogleAPI | undefined>(undefined)
  whenGapiInitialized.then((a) => setApi(a)).catch(() => {})

  return api
}

// Internal

function injectScript(callback: () => void) {
  const existing = document.querySelector(`script[src="${API_URL}"]`)
  if (existing) callback()

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = API_URL
  script.async = true

  // gapi can be populated asynchronously
  function waitForGapi() {
    if (typeof gapi === 'undefined') {
      requestAnimationFrame(waitForGapi)
      return
    }
    callback()
  }
  script.onload = waitForGapi

  document.body.appendChild(script)
}
