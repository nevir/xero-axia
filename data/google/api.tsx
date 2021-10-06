import * as react from 'react'

const GOOGLE_JS_API_URL = 'https://apis.google.com/js/api.js'

declare global {
  interface Window {
    __onGoogleAPILoaded: () => void
    __googleAPILoaded: boolean
  }
}

export const GoogleAPIScript = () => (
  // // See https://github.com/facebook/react/issues/13863
  // // See https://github.com/reactjs/rfcs/pull/129
  <div
    dangerouslySetInnerHTML={{
      __html: `
        <script
          async
          defer
          src="${GOOGLE_JS_API_URL}"
          onLoad="
            __googleAPILoaded = true;
            if (typeof __onGoogleAPILoaded !== 'undefined') {
              __onGoogleAPILoaded();
            }
          "
        ></script>
      `,
    }}
  />
)

let fullyLoaded = false
const loadedCallbacks: (() => void)[] = []
function onGoogleAPILoaded() {
  console.warn('onGoogleAPILoaded')
  gapi.load('xero-axia', () => {
    console.warn('gapi.load done')
    fullyLoaded = true

    for (const callback of loadedCallbacks) {
      callback()
    }
    loadedCallbacks.splice(0)
  })
}

// To be accessible to GoogleAPIScript.
if ('window' in global) {
  if (window.__googleAPILoaded) {
    onGoogleAPILoaded()
  } else {
    window.__onGoogleAPILoaded = onGoogleAPILoaded
  }
}

export function useGoogleAPI() {
  const [loaded, setLoaded] = react.useState(fullyLoaded)
  if (loaded) return gapi

  loadedCallbacks.push(() => setLoaded(true))
}
