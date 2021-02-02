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
    userHash: string;
    XSTSToken: string;
  };
}

export default class DeviceCodeAuthentication extends CacheManager {
  // To be defined later...
  // public readonly user: Record<string, unknown> | undefined;

  public readonly username: string;
  public msal: msal.PublicClientApplication;

  public constructor(
    options: { username: string; cacheDirectory?: string },
    private readonly callback?: () => void
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
      if (!user) this.create(this.username, {});
      this.callback?.();
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
        identityToken: `XBL3.0 x=${xsts.userHash};${xsts.XSTSToken}`,
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
    if (xsts.xboxlive?.XSTSToken && xsts?.xboxlive.userHash)
      return xsts.xboxlive;
    // return null;
    xboxlive.exchangeUserTokenForXSTSIdentity;

    // verify tokens
    // - get xbox user token
    // - get xsts token
    // --check if any are not found. return false and proceed to get MSA Token
    // --check if user token and xsts token are valid. if true do ----
    // -- check if user token is valid but xsts token is not, exhangeUserTokenforXSTSIDENT(ut.data) return true?
    // return false GET MSA TOKEN
    // check if msa token starts with 'd=, if not add it.
    // do this:  const xblUserToken = await XboxLiveAuth.exchangeRpsTicketForUserToken(msaAccessToken)
    // this.update(this.username, {xboxlive.usertoken: xblUserToken })
    // get xsts \/ do this i think
    /**
     *     const xsts = await XboxLiveAuth.exchangeUserTokenForXSTSIdentity(
      xblUserToken.Token, { XSTSRelyingParty: this.relyingParty, raw: false }
    )
    this.setCachedXstsToken(xsts) <-- this.update(this.username, { xboxlive.token: xsts }) 
     */
  }

  public async getMSAToken(): Promise<string> {
    // verify tokens
    // -get access token
    // -get refresh token
    // --check if any are not found. -> return false, we need to device code
    // -verify if valid access token and we have refresh token, -> we need to refresh
    // preform device code.
    // -if we have token return microsoft access token.
    // -else preform device code auth
    // --await tell the user to please authenticate now, if codecallback, do callback for shitty electron users.
    // once satifisfied, return accessToken.
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
