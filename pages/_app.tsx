import type { AppProps } from 'next/app'
import { WithGoogleAPI } from '../data/google/api'

import '../styles/globals.css'

function App({ Component, pageProps }: AppProps) {
  return (
    <WithGoogleAPI
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY!}
      discoveryDocs={[
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
      ]}
      scopes={['https://www.googleapis.com/auth/spreadsheets.readonly']}
    >
      <Component {...pageProps} />
    </WithGoogleAPI>
  )
}

export default App
