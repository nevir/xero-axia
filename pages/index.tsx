import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'

import { useCurrentGoogleUser, useGoogleSheetsAPI } from '../data/google/react'
import { Plan } from '../data/Plan'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const router = useRouter()
  const { user, state, signIn, signOut } = useCurrentGoogleUser()
  const sheets = useGoogleSheetsAPI()

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

        {!!sheets && (
          <button
            onClick={async () => {
              const plan = await Plan.create(sheets)
              router.push(`/${plan.id}`)
            }}
          >
            Create
          </button>
        )}
      </main>
    </div>
  )
}

export default Home
