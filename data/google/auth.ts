import { newLogger } from '../../lib/log'

import { GoogleAPI, loadGoogleAPIModules } from './api'

const moduleLog = newLogger('[google.auth] ')

// TODO: Better, explicit type here.
export type User = gapi.auth2.GoogleUser

export type UserUpdated = (newUser: User | undefined) => void

export class GoogleAuth {
  static async load(api: GoogleAPI) {
    const { auth2 } = await loadGoogleAPIModules(api, 'auth2')
    return new this(auth2)
  }

  private _onCurrentUserChangedCallbacks = new Set<UserUpdated>()

  constructor(
    module: typeof gapi['auth2'],
    private _auth = module.getAuthInstance(),
  ) {
    // Listen globally so that we can manage the lifecycle of user changed
    // callbacks.
    this._auth.currentUser.listen(() => {
      const user = this.getCurrentUser()
      for (const callback of this._onCurrentUserChangedCallbacks) {
        callback(user)
      }
    })
  }

  /**
   * Registers a callback to be called any time the current user changes.
   */
  onCurrentUserChanged(callback: UserUpdated) {
    this._onCurrentUserChangedCallbacks.add(callback)
    callback(this.getCurrentUser())

    return () => {
      this._onCurrentUserChangedCallbacks.delete(callback)
    }
  }

  /**
   * Retrieves the current user.
   */
  getCurrentUser() {
    const user = this._auth.currentUser.get()
    if (!user.isSignedIn()) return

    return user
  }

  /**
   * Signs in a new user.
   */
  async signIn() {
    const log = moduleLog.child('{signIn}')

    try {
      log.debug('signing in')
      await this._auth.signIn()
      log.debug('signed in', this.getCurrentUser())
    } catch (error: any) {
      if (error.error === 'popup_closed_by_user') {
        log.info('user canceled sign in', error)
      } else {
        log.error('failed to sgin in', error)
        throw error
      }
    }
  }
}
