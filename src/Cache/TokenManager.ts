import { CacheManager } from "./CacheManager";

export class TokenManager extends CacheManager {
  public async getUserToken(id: string) {
    const token = await super.get(id);
    if (!token) return;
    const valid =
      new Date((token as any).NotAfter).getDate() - Date.now() > 1000;
    return { valid, token: (token as any).Token, data: token };
  }

  public async getXSTSToken(id: string) {
    const token = await super.get(id);
    if (!token) return;
    const valid =
      new Date((token as any).NotAfter).getDate() - Date.now() > 1000;
    return { valid, token: (token as any).XSTSToken, data: token };
  }

  public async setUserToken(
    id: string,
    data: Record<string, unknown> = {}
  ): Promise<void> {
    return super.update(id, data);
  }

  public async setXSTSToken(
    id: string,
    data: Record<string, unknown> = {}
  ): Promise<void> {
    return super.update(id, data);
  }
  // https://github.com/PrismarineJS/node-minecraft-protocol/blob/master/src/client/tokens.js
}

/**
  getAccessToken () {
    const tokens = this.msaCache.AccessToken
    if (!tokens) return
    const account = Object.values(tokens).filter(t => t.client_id === this.msaClientId)[0]
    if (!account) {
      debug('[msa] No valid access token found', tokens)
      return
    }
    const until = new Date(account.expires_on * 1000) - Date.now()
    const valid = until > 1000
    return { valid, until: until, token: account.secret }
  }

 */
