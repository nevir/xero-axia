import * as react from 'react'
import { newDeferred } from '../../lib/util/async'

const GOOGLE_API_URL = 'https://apis.google.com/js/api.js'
const GOOGLE_API_TIMEOUT_SECONDS = 5

interface WithGoogleAPIProps {
  clientId: string
  apiKey: string
  discoveryDocs: string[]
  scopes: string[]
  loadTimeout?: number
  children: JSX.Element
}

const whenGapiInitialized = newDeferred<typeof gapi>()
export const WithGoogleAPI = (props: WithGoogleAPIProps) => {
  react.useEffect(() => {
    whenGapiInitialized.catch((error) => {
      console.error('[Google API] error initializing:', error)
    })

    console.debug('[Google API] injecting script')
    injectScript(() => {
      console.debug('[Google API] gapi.load')
      gapi.load('client:auth', {
        timeout:
          typeof props.loadTimeout === 'number'
            ? props.loadTimeout
            : GOOGLE_API_TIMEOUT_SECONDS * 1000,

        callback: () => {
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
              console.debug('[Google API] initialized')
              whenGapiInitialized.resolve(gapi)
            })
            .catch((error) => {
              whenGapiInitialized.reject(error)
            })
        },

        onerror: (error: any) => {
          whenGapiInitialized.reject(
            new Error(`unable to load Google API: ${error}`),
          )
        },

        ontimeout: () => {
          whenGapiInitialized.reject(
            new Error(
              `Timed out loading Google API after ${GOOGLE_API_TIMEOUT_SECONDS} seconds`,
            ),
          )
        },
      })
    })
  }, [true])

  return <react.Fragment>{props.children}</react.Fragment>
}

export function useGoogleAPI() {
  const [api, setApi] = react.useState<typeof gapi | undefined>(undefined)
  whenGapiInitialized.then((a) => setApi(a)).catch(() => {})

  return api
}

// Internal

function injectScript(callback: () => void) {
  const existing = document.querySelector(`script[src="${GOOGLE_API_URL}"]`)
  if (existing) callback()

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = GOOGLE_API_URL
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
