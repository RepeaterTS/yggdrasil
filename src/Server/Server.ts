import type { Agent } from 'http'

import { createHash } from 'crypto'
import { call, mcHexDigest } from '../Util/Util'
import fetch from 'node-fetch'
import { Constants } from '../Util/Constants'

/**
 * Client's Mojang handshake call
 * See http://wiki.vg/Protocol_Encryption#Client
 * @param  {String}   accessToken        Client's accessToken
 * @param  {String}   selectedProfile      Client's selectedProfile
 * @param  {String}   serverid     ASCII encoding of the server ID
 * @param  {String}   sharedsecret Server's secret string
 * @param  {String}   serverkey    Server's encoded public key
 * @param  {Agent}    [agent]  Agent
 * @async
 */
export async function join(accessToken: string, selectedProfile: string, serverid: string, sharedsecret: string, serverkey: string, agent?: Agent) {
  return await call(
    Constants.Mojang.DefaultHost,
    'session/minecraft/join',
    {
      accessToken,
      selectedProfile,
      serverId: mcHexDigest(createHash('sha1').update(serverid).update(sharedsecret).update(serverkey).digest())
    },
    agent
  )
}

/**
 * Server's Mojang handshake call
 * @param  {String}   username     Client's username, case-sensitive
 * @param  {String}   serverid     ASCII encoding of the server ID
 * @param  {String}   sharedsecret Server's secret string
 * @param  {String}   serverkey    Server's encoded public key
 * @param  {Agent}    [agent]  Agent
 * @async
 */
export async function hasJoined(username: string, serverid: string, sharedsecret: string, serverkey: string, agent?: Agent) {
  const hash: string = mcHexDigest(createHash('sha1').update(serverid).update(sharedsecret).update(serverkey).digest())
  const data = await fetch(`${Constants.Mojang.DefaultHost}/session/minecraft/hasJoined?username=${username}&serverId=${hash}`, { agent, method: 'GET' })
  const body = JSON.parse(await data.text())
  if (body.id !== undefined) return body
  else throw new Error('Failed to verify username!')
}
