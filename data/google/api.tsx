import * as react from 'react'
import { newLogger } from '../../lib/log'
import { newDeferred } from '../../lib/util/async'

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
  const log = newLogger('[Google API]', '{WithGoogleAPI}')
  instantiated = true

  react.useEffect(() => {
    whenGapiInitialized.catch((error) => {
      log.error('initialization failure:', error)
    })

    injectScript(() => {
      loadGoogleAPIModule('client')
        .then(() => {
          const config = {
            apiKey: props.apiKey,
            discoveryDocs: props.discoveryDocs,
            clientId: props.clientId,
            scope: props.scopes.join(' '),
          }

          log.debug('gapi.client.init', config)
          gapi.client
            .init(config)
            .then(() => {
              log.debug('gapi.client.init success')
              whenGapiInitialized.resolve(gapi)
            })
            .catch((error) => {
              log.debug('gapi.client.init error', error)
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
  const log = newLogger(
    '[Google API]',
    `{loadGoogleAPIModule ${moduleNames.join(':')}}`,
  )

  return new Promise((resolve, reject) => {
    log.debug('start')
    gapi.load(moduleNames.join(':'), {
      timeout: API_LOAD_TIMEOUT * 1000,

      callback: () => {
        log.debug('success')
        resolve()
      },

      onerror: (error: any) => {
        log.debug('error:', error)
        const modules = moduleNames.map((m) => `'${m}'`).join(', ')
        reject(
          new Error(`Failed to load Google API Module(s) ${modules}: ${error}`),
        )
      },

      ontimeout: () => {
        log.debug('timeout')
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

export interface NewModuleHookOptions<TModule> {
  moduleName: string
  getPreInit: (api: GoogleAPI) => TModule
  init: (api: GoogleAPI) => Promise<TModule>
}
/**
 *
 */
export function newModuleHook<TModule>({
  moduleName,
  getPreInit,
  init,
}: NewModuleHookOptions<TModule>): () => TModule | undefined {
  const log = newLogger('[Google API]', `{moduleHook ${moduleName}}`)

  let whenModuleLoaded: Promise<TModule>

  return function useGoogleAPIModule() {
    const [module, setModule] = react.useState<TModule | undefined>()
    const [waiting, setWaiting] = react.useState(false)
    const api = useGoogleAPI()

    if (module) return module
    if (!api) return
    if (waiting) return

    if (!whenModuleLoaded) {
      const preInit = getPreInit(api)
      if (preInit) {
        log.debug('got pre-initialized module', preInit)
        setModule(preInit)
        whenModuleLoaded = Promise.resolve(preInit)
        return preInit
      }

      setWaiting(true)
      whenModuleLoaded = new Promise((resolve, reject) => {
        loadGoogleAPIModule(moduleName)
          .then(() => {
            log.debug('init')
            init(api)
              .then((newModule) => {
                log.debug('init success', newModule)
                resolve(newModule)
                setWaiting(false)
              })
              .catch((error) => {
                log.error('initialization failure:', error)
                reject(error)
                setWaiting(false)
              })
          })
          .catch((error) => {
            log.error('failed to load API module:', error)
            reject(error)
            setWaiting(false)
          })
      })
    }

    whenModuleLoaded.then((m) => setModule(m)).catch(() => {})
  }
}

// Internal

function injectScript(callback: () => void) {
  const log = newLogger('[Google API]', '{injectScript}')
  const existing = document.querySelector(`script[src="${API_URL}"]`)
  if (existing) {
    log.warn('script already injected; skipping')
    callback()
    return
  }

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = API_URL
  script.async = true

  // gapi can be populated asynchronously
  function waitForGapi() {
    if (typeof gapi === 'undefined') {
      log.debug('polling')
      requestAnimationFrame(waitForGapi)
      return
    }
    log.debug('loaded')
    callback()
  }
  script.onload = waitForGapi

  document.body.appendChild(script)
  log.debug('injected')
}
