import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { useGoogleAPI } from '../data/google/api'
import { useGoogleUser } from '../data/google/auth'

const Home: NextPage = () => {
  const api = useGoogleAPI()
  const { user, state, signIn } = useGoogleUser()

  return (
    <div className={styles.container}>
      <Head>
        <title>Xero Axia</title>

        <meta
          name='google-signin-client_id'
          content={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        />
      </Head>

      <main className={styles.main}>
        <ul>
          <li>Google API loaded: {!!api}</li>
          <li>
            Google User: {user?.getBasicProfile()?.getName()} ({state})
          </li>
        </ul>
        <button onClick={() => signIn()}>Authenticate With Google</button>
      </main>
    </div>
  )
}

export default Home
