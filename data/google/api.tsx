import * as react from 'react'

import { newLogger } from '../../lib/log'
import { SingletonHook, singletonHook } from '../../lib/useSingleton'

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

let whenGapiInitialized: PromiseLike<GoogleAPI>
/**
 * Loads the Google API and any specific services you need.
 *
 * This must be instantiated once per application, and before calling
 * useGoogleAPI.
 */
export const WithGoogleAPI = (props: WithGoogleAPIProps) => {
  if (!whenGapiInitialized) {
    const log = newLogger('[Google API]', '{WithGoogleAPI}')
    whenGapiInitialized = new Promise((resolve, reject) => {
      injectScript((api) => {
        loadGoogleAPIModule(api, 'client')
          .then(() => {
            const config = {
              apiKey: props.apiKey,
              discoveryDocs: props.discoveryDocs,
              clientId: props.clientId,
              scope: props.scopes.join(' '),
            }

            log.debug('client.init', config)
            api.client
              .init(config)
              .then(() => {
                log.debug('client.init success')
                resolve(api)
              })
              .catch((error) => {
                log.debug('client.init error', error)
                reject(error)
              })
          })
          .catch((error) => {
            log.error('failed to load client module:', error)
            reject(error)
          })
      })
    })
  }

  return <react.Fragment>{props.children}</react.Fragment>
}

export const useGoogleAPI = singletonHook(async () => {
  if (!whenGapiInitialized) {
    throw new Error(
      `The application must first be configured via <WithGoogleAPI … /> before calling useGoogleAPI()`,
    )
  }

  return whenGapiInitialized
})

export interface ModuleHookOptions<TModule> {
  name: string
  preload: (api: GoogleAPI) => PromiseLike<TModule>
  resolve: (api: GoogleAPI) => PromiseLike<TModule>
}

export function moduleHook<TModule>(
  options: ModuleHookOptions<TModule>,
): SingletonHook<TModule> {
  const log = newLogger('[Google API]', `{moduleHook ${options.name}}`)

  return singletonHook(async () => {
    log.debug('loading')
    const api = await useGoogleAPI.resolve

    const preloaded = await options.preload(api)
    if (preloaded) {
      log.debug('found preloaded', preloaded)
      return preloaded
    }

    await loadGoogleAPIModule(api, options.name)

    log.debug('resolving')
    return await options.resolve(api)
  })
}

// Internal

function injectScript(callback: (api: GoogleAPI) => void) {
  const log = newLogger('[Google API]', '{injectScript}')
  const existing = document.querySelector(`script[src="${API_URL}"]`)
  if (existing) {
    log.warn('script already injected; skipping')
    callback(gapi)
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
    callback(gapi)
  }
  script.onload = waitForGapi

  document.body.appendChild(script)
  log.debug('injected')
}

/**
 * Loads one or more Google API modules.
 */
async function loadGoogleAPIModule(
  api: GoogleAPI,
  ...moduleNames: string[]
): Promise<void> {
  const log = newLogger(
    '[Google API]',
    `{loadGoogleAPIModule ${moduleNames.join(':')}}`,
  )

  return new Promise((resolve, reject) => {
    log.debug('start')
    api.load(moduleNames.join(':'), {
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
