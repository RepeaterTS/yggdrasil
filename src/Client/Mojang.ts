import type { Agent } from "http";

import { v4 } from "uuid";
import { call } from "../Util/Util";
import { Constants } from "../Util/Constants";

/**
 * Attempts to authenticate a user.
 * @param {Object} options Config object
 * @param  {Agent}    [agent]  Agent
 * @async
 */
export async function auth(
  options: {
    agent?: string;
    username: string;
    password: string;
    token?: string;
    version: string;
    requestUser?: boolean;
  },
  agent?: Agent
) {
  if (options.token === null) delete options.token;
  else options.token = options.token ?? v4();

  options.agent = options.agent ?? Constants.DefaultUserAgent;

  return call(
    Constants.Mojang.DefaultHost,
    "authenticate",
    {
      agent: {
        name: options.agent,
        version:
          options.agent === Constants.DefaultUserAgent ? 1 : options.version,
      },
      username: options.username,
      password: options.password,
      clientToken: options.token,
      requestUser: options.requestUser === true,
    },
    agent
  );
}

/**
 * Refreshes a accessToken.
 * @param  {String}   accessToken Old Access Token
 * @param  {String}   clientToken Client Token
 * @param  {String=false}   requestUser Whether to request the user object
 * @param  {Agent}    [agent]  Agent
 * @async
 */
export async function refresh(
  accessToken: string,
  clientToken: string,
  requestUser?: boolean,
  agent?: Agent
) {
  const data = await call(
    Constants.Mojang.DefaultHost,
    "refresh",
    { accessToken, clientToken, requestUser: requestUser ?? false },
    agent
  );
  if (data.clientToken !== clientToken)
    throw new Error("clientToken assertion failed");
  return [data.accessToken, data];
}

/**
 * Validates an access token
 * @param  {String}   accessToken Token to validate
 * @param  {Agent}    [agent]  Agent
 * @async
 */
export async function validate(accessToken: string, agent?: Agent) {
  return call(Constants.Mojang.DefaultHost, "validate", { accessToken }, agent);
}

/**
 * Invalidates all access tokens.
 * @param  {String}   username User's user
 * @param  {String}   password User's pass
 * @param  {Agent}    [agent]  Agent
 * @async
 */
export async function signout(
  username: string,
  password: string,
  agent?: Agent
) {
  return call(
    Constants.Mojang.DefaultHost,
    "signout",
    { username, password },
    agent
  );
}
