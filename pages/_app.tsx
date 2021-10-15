import type { AppProps } from 'next/app'
import { WithGoogleAPI, WithGoogleAuthAPI } from '../data/google/react'
import { WithGoogleSheetsAPI } from '../data/google/react/sheets'

import '../styles/globals.css'

function App({ Component, pageProps }: AppProps) {
  return (
    <WithGoogleAPI
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY!}
      discoveryDocs={[
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
      ]}
      scopes={['https://www.googleapis.com/auth/spreadsheets']}
    >
      <WithGoogleAuthAPI>
        <WithGoogleSheetsAPI>
          <Component {...pageProps} />
        </WithGoogleSheetsAPI>
      </WithGoogleAuthAPI>
    </WithGoogleAPI>
  )
}

export default App
