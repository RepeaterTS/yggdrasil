import uuid from 'uuid'
import { createHash } from 'crypto'
import fetch from 'node-fetch'
import { call, mcHexDigest } from '../Util/Util'
import type { Agent } from 'http'

import { Constants } from '../Util/Constants'

/**
 * Attempts to authenticate a user.
 * @param {Object} options Config object
 */
export async function auth(options: { agent?: string, username: string, password: string, token?: string, version: string, requestUser?: boolean }, agent?:Agent) {
  if (options.token === null) delete options.token
  else options.token = options.token ?? uuid.v4()

  options.agent = options.agent ?? Constants.DefaultUserAgent

  return await call(Constants.Mojang.DefaultHost,
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
    agent
  )
}

/**
 * Refreshes a accessToken.
 * @param  {String}   accessToken Old Access Token
 * @param  {String}   clientToken Client Token
 * @param  {String=false}   requestUser Whether to request the user object
 */
export async function refresh(accessToken: string, clientToken: string, requestUser?: boolean, agent?: Agent) {
  const data = await call(Constants.Mojang.DefaultHost, 'refresh', { accessToken, clientToken, requestUser: requestUser ?? false }, agent)
  if (data.clientToken !== clientToken) throw new Error('clientToken assertion failed')
  return [data.accessToken, data]
}

/**
 * Validates an access token
 * @param  {String}   accessToken Token to validate
 */
export async function validate(accessToken: string, agent?: Agent) {
  return call(Constants.Mojang.DefaultHost, 'validate', { accessToken }, agent)
}

/**
 * Invalidates all access tokens.
 * @param  {String}   username User's user
 * @param  {String}   password User's pass
 */
export async function signout(username: string, password: string, agent?: Agent) {
  return call(Constants.Mojang.DefaultHost, 'signout', { username, password }, agent)
}

/**
 * Client's Mojang handshake call
 * See http://wiki.vg/Protocol_Encryption#Client
 * @param  {String}   accessToken        Client's accessToken
 * @param  {String}   selectedProfile      Client's selectedProfile
 * @param  {String}   serverid     ASCII encoding of the server ID
 * @param  {String}   sharedsecret Server's secret string
 * @param  {String}   serverkey    Server's encoded public key
 * @param  {Function} cb           (is okay, data returned by server)
 * @async
 */
export async function join(accessToken: string, selectedProfile: string, serverid: string, sharedsecret: string, serverkey: string, agent?: Agent) {
  return await call(Constants.Mojang.DefaultHost,
    'session/minecraft/join',
    {
      accessToken,
      selectedProfile,
      serverId: mcHexDigest(createHash('sha1').update(serverid).update(sharedsecret).update(serverkey).digest())
    }, agent)
}

/**
 * Server's Mojang handshake call
 * See https://wiki.vg/Protocol_Encryption#Server
 * @param  {String}   username     Client's username, case-sensitive
 * @param  {String}   serverid     ASCII encoding of the server ID
 * @param  {String}   sharedsecret Server's secret string
 * @param  {String}   serverkey    Server's encoded public key
 * @returns {object} Client Information
 * @async
 */
export async function joined(username: string, serverid: string, sharedsecret: string, serverkey: string, agent?: Agent) {
  const hash: string = mcHexDigest(createHash('sha1').update(serverid).update(sharedsecret).update(serverkey).digest())
  const data = await fetch(`${Constants.Mojang.DefaultHost}/session/minecraft/hasJoined?username=${username}&serverId=${hash}`, { agent, method: 'GET' })
  const body = JSON.parse(await data.text())
  if (body.id !== undefined) return body
  else throw new Error('Failed to verify username!')
}