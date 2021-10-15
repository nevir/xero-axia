import { newLogger } from '../../lib/log'

import { GoogleAPI, loadGoogleAPIModules } from './api'

const moduleLog = newLogger('[google.auth]         ')

// TODO: Better, explicit type here.
export type User = gapi.auth2.GoogleUser

export type AuthStateChanged = (
  newUser: User | undefined,
  newState: GoogleAuthState,
) => void

export type GoogleAuthState = 'idle' | 'signing-in' | 'signing-out'

export class GoogleAuth {
  static async load(api: GoogleAPI) {
    const { auth2 } = await loadGoogleAPIModules(api, 'auth2')
    return new this(auth2)
  }

  public state: GoogleAuthState = 'idle'
  public user: User | undefined

  constructor(
    module: typeof gapi['auth2'],
    private _auth = module.getAuthInstance(),
  ) {
    this._initializeCurrentUser()
  }

  // Users

  private _toUser(user: gapi.auth2.GoogleUser) {
    if (!user.isSignedIn()) return
    return user
  }

  private _initializeCurrentUser() {
    this.user = this._toUser(this._auth.currentUser.get())

    // Listen globally so that we can manage the lifecycle of user changed
    // callbacks.
    this._auth.currentUser.listen((user) => {
      moduleLog.debug('gapi currentUser callback:', user)
      this._setUser(this._toUser(user))
    })
  }

  /**
   * Signs in a new user.
   */
  async signIn() {
    const log = moduleLog.child('{signIn}')
    if (this.state !== 'idle') {
      if (this.state === 'signing-in') {
        log.warn('already signing in; ignoring')
        return
      } else {
        throw new Error(
          'Please wait for the current operation to complete before signing in',
        )
      }
    }

    try {
      this._setState('signing-in')
      await this._auth.signIn()
    } catch (error: any) {
      if (error.error === 'popup_closed_by_user') {
        log.info('user canceled sign in:', error)
      } else {
        log.error('failed to sign in:', error)
        throw error
      }
    } finally {
      this._setState('idle')
    }
  }

  /**
   * Signs the current user out.
   */
  async signOut() {
    const log = moduleLog.child('{signOut}')
    if (this.state !== 'idle') {
      if (this.state === 'signing-out') {
        log.warn('already signing out; ignoring')
        return
      } else {
        throw new Error(
          'Please wait for the current operation to complete before signing out',
        )
      }
    }

    try {
      this._setState('signing-out')
      await this._auth.signOut()
    } catch (error: any) {
      log.error('failed to sign out:', error)
      throw error
    } finally {
      this._setState('idle')
    }
  }

  // State Changes

  private _onStatusChangedCallbacks = new Set<AuthStateChanged>()

  private _setState(newState: GoogleAuthState) {
    if (this.state === newState) return

    this.state = newState
    this._emitStatusChangeEvent()
  }

  private _setUser(newUser: User | undefined) {
    if (this.user === newUser) return

    this.user = newUser
    this._emitStatusChangeEvent()
  }

  private _emitStatusChangeEvent() {
    const { user, state } = this
    moduleLog.debug('state change', { state, user })

    for (const callback of this._onStatusChangedCallbacks) {
      callback(user, this.state)
    }
  }

  /**
   * Registers a callback to be called any time the current user changes.
   */
  onStatusChanged(callback: AuthStateChanged) {
    this._onStatusChangedCallbacks.add(callback)
    callback(this.user, this.state)

    return () => {
      this._onStatusChangedCallbacks.delete(callback)
    }
  }
}
