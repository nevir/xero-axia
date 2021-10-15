import { newLogger } from '../../lib/log'

const moduleLog = newLogger('[google.api]          ')

export type GoogleAPI = typeof gapi

export type GoogleAPIModuleName = Exclude<keyof GoogleAPI, 'load'>
export type GoogleAPIModules = {
  [TName in GoogleAPIModuleName]: GoogleAPI[TName]
}

/**
 * Loads the core Google API client
 */
export async function loadGoogleAPI(options: GoogleAPIClientOptions) {
  const api = await injectScript()
  const { client } = await loadGoogleAPIModules(api, 'client')
  await initClient(client, options)

  return api
}

// Internal

/**
 * Attaches the Google API script to the document and loads it asynchronously.
 */
export async function injectScript({
  apiUrl = 'https://apis.google.com/js/api.js',
  timeoutMs = 15000,
} = {}): Promise<GoogleAPI> {
  const log = moduleLog.child('{injectScript}')
  log.debug({ apiUrl, timeoutMs })

  const existing = document.querySelector(`script[src="${apiUrl}"]`)
  if (existing) {
    log.debug('Google API script is already loaded; reusing')
  } else {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = apiUrl
    script.async = true

    document.head.appendChild(script)
    log.debug('injected', script)
  }

  return new Promise((resolve, reject) => {
    const startedAt = performance.now()

    function waitForGapi() {
      const duration = performance.now() - startedAt
      if (typeof gapi !== 'undefined') {
        log.debug('loaded after', duration, 'milliseconds')
        resolve(gapi)
      } else if (duration > timeoutMs) {
        log.debug('timeout')
        reject(new Error('timed out trying to load the Google API'))
      } else {
        requestAnimationFrame(waitForGapi)
      }
    }

    waitForGapi()
  })
}

/**
 * Options used to load the Google API.
 */
export interface GoogleAPIClientOptions {
  clientId: string
  apiKey: string
  discoveryDocs: string[]
  scopes: string[]
}

/**
 * Initializes the core Google API client.
 */
export async function initClient(
  client: GoogleAPIModules['client'],
  options: GoogleAPIClientOptions,
) {
  const log = moduleLog.child('{initClient}')

  const config = {
    apiKey: options.apiKey,
    discoveryDocs: options.discoveryDocs,
    clientId: options.clientId,
    scope: options.scopes.join(' '),
  }
  log.debug(config)

  try {
    await client.init(config)
    log.debug('success')
  } catch (error) {
    log.debug('error', error)
    throw error
  }
}

/**
 * Loads one or more Google API modules.
 */
export async function loadGoogleAPIModules<
  TModuleNames extends GoogleAPIModuleName,
>(
  api: GoogleAPI,
  nameOrNames: TModuleNames | TModuleNames[],
  { timeoutMs = 15000 } = {},
): Promise<Pick<GoogleAPIModules, TModuleNames>> {
  const names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames]
  const joinedNames = names.join(':')
  const log = moduleLog.child(`{loadGoogleAPIModules ${joinedNames}}`)
  log.debug({ timeoutMs })

  return new Promise((resolve, reject) => {
    log.debug('start')
    api.load(joinedNames, {
      timeout: timeoutMs,

      callback: () => {
        const modules = {} as Pick<GoogleAPIModules, TModuleNames>
        for (const name of names) {
          modules[name] = api[name]
        }
        log.debug('success', modules)

        resolve(modules)
      },

      onerror: (error: any) => {
        log.debug('error:', error)
        reject(
          new Error(
            `Failed to load Google API Module(s) ${joinedNames}: ${error}`,
          ),
        )
      },

      ontimeout: () => {
        log.debug('timeout')
        reject(
          new Error(
            `Timed out loading Google API Module(s) ${joinedNames} after ${timeoutMs} milliseconds`,
          ),
        )
      },
    })
  })
}
