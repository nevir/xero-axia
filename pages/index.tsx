import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import { useGoogleAPI } from '../data/google/api'
import { useGoogleUser } from '../data/google/auth'

const Home: NextPage = () => {
  const api = useGoogleAPI()
  const { user, state, signIn, signOut } = useGoogleUser()

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
          <li>Google API loaded: {api ? 'yes' : 'no'}</li>
          <li>
            Google User: {user?.getBasicProfile()?.getName()} ({state})
          </li>
        </ul>
        {(state === 'signing-in' || !signIn) && (
          <button disabled>Log In With Google</button>
        )}
        {(state === 'idle' || state === 'canceled') && signIn && (
          <button onClick={() => signIn()}>Log In With Google</button>
        )}
        {state === 'signed-in' && signOut && (
          <button onClick={() => signOut()}>Log Out</button>
        )}
      </main>
    </div>
  )
}

export default Home
