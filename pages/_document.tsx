import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document'
import { GoogleAPIScript } from '../data/google/api'

class MyDocument extends Document {
  static async getInitialProps(context: DocumentContext) {
    const initialProps = await Document.getInitialProps(context)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <GoogleAPIScript />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
