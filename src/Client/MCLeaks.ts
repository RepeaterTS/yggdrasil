import type { Agent } from "http";

import { Constants } from "../Util/Constants";
import { call } from "../Util/Util";

/**
 * Redeems an ALT-TOKEN and returns the username of the alt and a Session-ID for further requests with this alt.
 * @param {string} token AltToken
 * @param {Agent} [agent] User-Agent
 * @async
 */
export async function auth(
  options: { agent?: string; token: string },
  agent?: Agent | undefined
) {
  return call(
    Constants.MCLeaks.DefaultHost,
    "redeem",
    { token: options.token },
    agent
  );
}

/**
 * Sends the request to the Mojang sessionserver with the alt's accesstoken (https://sessionserver.mojang.com/session/minecraft/join) to validate the alt.
 * @param {object} options Object containing session, mcname, serverhash and "host:port"
 * @param {Agent} [agent]  User-Agent
 * @async
 */
export async function join(
  options: {
    session: string;
    mcname: string;
    serverhash: string;
    server: string;
  },
  agent: Agent | undefined
) {
  return call(
    Constants.MCLeaks.DefaultHost,
    "joinserver",
    {
      session: options.session,
      mcname: options.mcname,
      serverhash: options.serverhash,
      server: options.server,
    },
    agent
  );
}
