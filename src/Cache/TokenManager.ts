import { CacheManager } from './CacheManager'

export class TokenManager extends CacheManager {
    constructor(directory?: string) {
        super(directory)
    }

    public async init(): Promise<void> {
        await super.init()
    }

    public async getUserToken(id: string) {
        const token = super.get(id);
        if (!token) return;
        const valid = (new Date(token.NotAfter) - Date.now()) > 1000
        return { valid, token: token.Token, data: token }
    }

    public async getXSTSToken(id: string) {
        const token = super.get(id);
        if (!token) return;
        const valid = (new Date(token.NotAfter) - Date.now()) > 1000
        return { valid, token: token.XSTSToken, data: token }
    }

    public async setUserToken(id: string, data: object = {}): Promise<void> {
        super.update(id, data);
    }

    public async setXSTSToken(id: string, data: object = {}): Promise<void> {
        super.update(id, data)
    }
    // https://github.com/PrismarineJS/node-minecraft-protocol/blob/master/src/client/tokens.js
}