import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'

import { useCurrentGoogleUser } from '../data/google/react'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const { user, state, signIn, signOut } = useCurrentGoogleUser()

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
          <li>
            Google User: {user?.name}{' '}
            {user?.imageUrl && (
              <Image
                src={user.imageUrl}
                alt={'user photo'}
                height={32}
                width={32}
              />
            )}
          </li>
          <li>auth state: {state}</li>
        </ul>

        {state === 'idle' && !user && (
          <button onClick={() => signIn()}>Log In With Google</button>
        )}
        {state === 'signing-in' && <button disabled>Log In With Google</button>}
        {state === 'idle' && !!user && (
          <button onClick={() => signOut()}>Log Out</button>
        )}
        {state === 'signing-out' && <button disabled>Log Out</button>}
      </main>
    </div>
  )
}

export default Home
