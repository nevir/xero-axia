import * as react from 'react'

import { newLogger } from '../../../lib/log'

import { GoogleAPIContext } from '.'
import { GoogleSheetsAPI } from '../sheets'

const moduleLog = newLogger('[google.react.sheets] ')

export const GoogleSheetsAPIContext = react.createContext<
  GoogleSheetsAPI | undefined
>(undefined)

/**
 * Loads the Google Sheets API.
 */
export const WithGoogleSheetsAPI = (props: { children: JSX.Element }) => {
  const api = react.useContext(GoogleAPIContext)
  const [sheets, setSheets] = react.useState<GoogleSheetsAPI>()

  react.useEffect(() => {
    if (!api) return

    const log = moduleLog.child('{WithGoogleSheetsAPI}')
    log.debug('loading Sheets API')

    GoogleSheetsAPI.load(api)
      .then((sheets) => {
        log.debug('providing context:', sheets)
        setSheets(sheets)
      })
      .catch((error) => {
        log.error('error loading Google Sheets API:', error)
      })
  }, [api])

  return (
    <GoogleSheetsAPIContext.Provider value={sheets}>
      {props.children}
    </GoogleSheetsAPIContext.Provider>
  )
}

/**
 * Provides access to the Google Sheets API
 */
export function useGoogleSheetsAPI() {
  return react.useContext(GoogleSheetsAPIContext)
}
