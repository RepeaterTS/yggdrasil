import uuid from 'uuid'
import * as utils from '../Util/Util'
import type { Agent } from 'http'

import { Constants } from '../Util/Constants'

const Client = {
  /**
   * Attempts to authenticate a user.
   * @param  {Object}   options Config object
   */
  auth: async function (options: { agent?: string, username: string, password: string, token?: string, version: string, requestUser?: boolean }) {
    if (options.token === null) delete options.token
    else options.token = options.token ?? uuid.v4()

    options.agent = options.agent ?? Constants.DefaultUserAgent

    return await utils.call((this as any)?.host as string ?? Constants.Mojang.DefaultHost,
      'authenticate',
      {
        agent: {
          name: options.agent,
          version: options.agent === Constants.DefaultUserAgent ? 1 : options.version
        },
        username: options.username,
        password: options.password,
        clientToken: options.token,
        requestUser: options.requestUser === true
      },
      (this as any)?.agent as Agent
    )
  },
  /**
   * Refreshes a accessToken.
   * @param  {String}   accessToken Old Access Token
   * @param  {String}   clientToken Client Token
   * @param  {String=false}   requestUser Whether to request the user object
   */
  refresh: async function (accessToken: string, clientToken: string, requestUser?: boolean) {
    const data = await utils.call((this as any)?.host as string ?? Constants.Mojang.DefaultHost, 'refresh', { accessToken, clientToken, requestUser: requestUser ?? false }, (this as any)?.agent as Agent)
    if (data.clientToken !== clientToken) throw new Error('clientToken assertion failed')
    return [data.accessToken, data]
  },
  
  /**
   * Validates an access token
   * @param  {String}   accessToken Token to validate
   */
  validate: async function (accessToken: string) {
    return await utils.call((this as any)?.host as string ?? Constants.Mojang.DefaultHost, 'validate', { accessToken }, (this as any)?.agent as Agent)
  },

  /**
   * Invalidates all access tokens.
   * @param  {String}   username User's user
   * @param  {String}   password User's pass
   */
  signout: async function (username: string, password: string) {
    return await utils.call((this as any)?.host as string ?? Constants.Mojang.DefaultHost, 'signout', { username, password }, (this as any)?.agent as Agent)
  }
}

export = Client