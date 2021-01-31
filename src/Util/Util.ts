import type { Agent } from 'http'

import fetch from 'node-fetch'

const { version } = require('../package.json'); // eslint-disable-line

/**
 * Send stuff somewhere
 * @param {String} host  host
 * @param {String} path path
 * @param {Object} data data to send
 * @param {Agent} [agent] agent
 */
export async function call(host: string, path: string, data: any, agent?: Agent) {
  const resp = await fetch(`${host}/${path}`, {
    agent,
    body: JSON.stringify(data),
    headers: {
      'User-Agent': `node-yggdrasil/${version as string}`,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  })

  let body: string | any = await resp.text()
  if (body.length === 0) return ''
  try {
    body = JSON.parse(body)
  } catch (e) {
    if (e instanceof SyntaxError) {
      if (resp.status === 403) {
        if ((body as string).includes('Request blocked.')) {
          throw new Error('Request blocked by CloudFlare')
        }
        if ((body as string).includes('cf-error-code">1009')) {
          throw new Error('Your IP is banned by CloudFlare')
        }
      } else {
        throw new Error(`Response is not JSON. Status code: ${resp.status ?? 'no status code'}`)
      }
    } else {
      throw e
    }
  }
  if (body?.error !== undefined) throw new Error(body?.errorMessage)
  return body
}

/**
 * Java's stupid hashing method
 * @param  {Buffer|String} hash     The hash data to stupidify
 * @param  {String} encoding Optional, passed to Buffer() if hash is a string
 * @return {String}          Stupidified hash
 */
export function mcHexDigest(hash: Buffer | String, encoding?: String): string {
  if (!(hash instanceof Buffer)) {
    hash = (Buffer as any).from(hash, encoding)
  }
  // check for negative hashes
  const negative = (hash as any).readInt8(0) < 0
  if (negative) performTwosCompliment(hash)
  return (negative ? '-' : '') + hash.toString('hex').replace(/^0+/g, '')
}

/**
 * Java's annoying hashing method.
 * All credit to andrewrk
 * https://gist.github.com/andrewrk/4425843
 */
function performTwosCompliment(buffer: any): void {
  let carry = true
  let i, newByte, value
  for (i = buffer.length - 1; i >= 0; --i) {
    value = buffer.readUInt8(i)
    newByte = ~value & 0xff
    if (carry) {
      carry = newByte === 0xff
      buffer.writeUInt8(carry ? 0 : newByte + 1, i)
    } else {
      buffer.writeUInt8(newByte, i)
    }
  }
}
