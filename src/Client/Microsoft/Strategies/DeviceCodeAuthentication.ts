import msal, { TokenCacheContext } from "@azure/msal-node";
import xboxlive from "@xboxreplay/xboxlive-auth";
import fetch from "node-fetch";

import { CacheManager } from "../../../Cache/CacheManager";
import { Constants } from "../../../Util/Constants";

export interface schema {
  accessToken: string;
  clientToken: string;
  selectedProfile: string;
  profiles: [
    {
      id: string;
      legacy: boolean;
      name: string;
    }
  ];
  username: string;
  xboxlive?: {
    userHash: {
      expires: string;
      token: string;
    };
    XSTSToken: {
      expires: string;
      token: string;
    };
  };
}

export default class DeviceCodeAuthentication extends CacheManager {
  // To be defined later...
  // public readonly user: Record<string, unknown> | undefined;

  public readonly username: string;
  public msal: msal.PublicClientApplication;

  public constructor(
    options: { username: string; cacheDirectory?: string },
    private readonly callback?: (response: Record<string, unknown>) => void
  ) {
    super(options.cacheDirectory);

    if (!options || !options?.username)
      throw new Error(
        "You must pass a username at minimum to be used with Microsoft Device Authentication."
      );

    this.username = options.username;

    const config = Constants.MSAL;
    (config as Record<string, unknown>).cache = {
      cachePlugin: {
        beforeCacheAccess: async (cacheContext: TokenCacheContext) => {
          const id: string = (await this.get(this.username)) as string;
          if (!id) throw new Error("could not find id");
          cacheContext.tokenCache.deserialize(id);
        },
        afterCacheAccess: async (cacheContext: TokenCacheContext) => {
          if (cacheContext.cacheHasChanged) {
            await this.update(
              this.username,
              cacheContext.tokenCache.serialize()
            );
          }
        },
      },
    };

    this.msal = new msal.PublicClientApplication(config);

    void this.get(this.username).then((user) => {
      if (!user) void this.create(this.username, {});
    });
  }

  public async refreshToken() {
    const refreshToken: string = await this.get(this.username).then(
      (user) => (user as any).refreshToken
    );
    if (!refreshToken)
      throw new Error("Cannot refresh without a refresh token.");

    this.msal
      .acquireTokenByRefreshToken({
        refreshToken,
        scopes: Constants.MSAL_SCOPES,
      })
      .then((response) => void Promise.resolve(response))
      .catch((error) => void Promise.reject(error));
  }

  public async getMinecraftToken() {
    const token: Partial<schema> = (await this.get(
      this.username
    )) as Partial<schema>;
    if (token?.accessToken)
      return {
        accessToken: token.accessToken,
        profile: (token as schema).profiles[0],
      };
    const xsts = await this.getXBOXToken();

    const LoginWithXbox = await fetch(Constants.MinecraftServicesLogWithXbox, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "node-minecraft-protocol",
      },
      body: JSON.stringify({
        identityToken: `XBL3.0 x=${xsts?.userHash};${xsts?.XSTSToken}`,
      }),
    }).then((res) => {
      if (res.ok) return res.json();
      throw Error(res.statusText);
    });

    void this.update(this.username, {
      accessToken: LoginWithXbox.access_token,
    });
    return {
      accessToken: LoginWithXbox.access_token,
      profile: (token as schema).profiles[0],
    };
  }

  public async getXBOXToken(): Promise<{
    userHash: string;
    XSTSToken: string;
  } | null> {
    const xsts: Partial<schema> = (await this.get(
      this.username
    )) as Partial<schema>;

    // I don't know what I was planning here.
    /** if (xsts.xboxlive?.XSTSToken && xsts?.xboxlive.userHash) {
      if (this.isTokenValid(xsts.xboxlive.XSTSToken.expires) && this.isTokenValid(xsts.xboxlive.userHash.expires))
    } **/

    if (xsts.xboxlive?.XSTSToken && xsts.xboxlive?.userHash) {
      if (this.isTokenValid(xsts.xboxlive.XSTSToken.expires)) {
        if (this.isTokenValid(xsts.xboxlive.userHash.expires)) {
          return {
            userHash: xsts.xboxlive.userHash.token,
            XSTSToken: xsts.xboxlive.XSTSToken.token,
          };
        }
        const exchange = await this.refreshXSTSToken(
          xsts.xboxlive.userHash.token
        );
        return { userHash: exchange.userHash, XSTSToken: exchange.XSTSToken };
      }
    }
    const MSAToken = await this.getMSAToken();
    const UserToken = await this.refreshUserToken(MSAToken);
    const XSTSToken = await this.refreshXSTSToken(UserToken);
    return XSTSToken;
  }

  public async getMSAToken(): Promise<string> {
    const token = await this.get(this.username);
    if (token.accessToken) return token.accessToken;

    const res = await this.preformDeviceCodeAuth(
      (response: Record<string, unknown>) => {
        console.log(
          `[@repeaterts/yggdrasil] First time logging in. Please authenticate with Microsoft:\n${response.message}`
        );
        this.callback?.(response);
      }
    );

    console.log(
      `[@repeaterts/yggdrasil] Signed in as ${res.account.username}.`
    );
    return res.accessToken;
  }

  public async refreshUserToken(msaAccessToken: string) {
    if (!msaAccessToken.startsWith("d="))
      msaAccessToken = `d=${msaAccessToken}`;
    const xblusertoken = await xboxlive
      .exchangeRpsTicketForUserToken(msaAccessToken)
      .catch((err) => {
        throw new Error(
          `Unable to exchange RPS Ticket for User Token.\nPlease create a new issue: https://github.com/RepeaterTS/yggdrasil/issues with the following:\n${err}`
        );
      });
    await this.update(this.username, {
      xboxlive: {
        userHash: {
          token: xblusertoken,
        },
      },
    });
    return xblusertoken;
  }

  public async refreshXSTSToken(UserToken: string) {
    const exchange = await xboxlive
      .exchangeUserTokenForXSTSIdentity(UserToken, {
        XSTSRelyingParty: Constants.XSTSRelyingParty,
        raw: false,
      })
      .catch((err) => {
        throw Error(`Unable to exchange user token for a new identity: ${err}`);
      });
    await this.update(this.username, {
      xboxlive: {
        userHash: {
          token: exchange.userHash,
          expires: exchange.expiresOn,
        },
        XSTSToken: {
          token: exchange.XSTSToken,
          expires: exchange.expiresOn,
        },
      },
    });
    return exchange;
  }

  public async preformDeviceCodeAuth(callback) {
    const deviceCodeRequest = {
      deviceCodeCallback: (resp) => {
        callback(resp);
      },
      scopes: Constants.MSAL_SCOPES,
    };
    this.msal
      .acquireTokenByDeviceCode(deviceCodeRequest)
      .then((response) => void Promise.resolve(response))
      .catch((error) => void Promise.reject(error));
  }

  public isTokenValid(expires: string) {
    return Boolean(new Date(expires as any) - Date.now() > 1000);
  }
}

// Feburary 2nd, 2021 at 2:07am PST - Kashall and Rob9315

/** So how are we designating file names? email or the part before @? or what ever username they have on the account?
// maybe uuid?
// probably better

I agree
lets just leave this in lol
So we really dont ever save anything until we've completed the full auth.
k
*/

// TODO: Spam Later...  callback?.();

/**
 * Authflow -> verify minecraft token, if exists return valid minecraft token
 * if not valid, try to get xbox xsts token and try to verify xblx token
 */
