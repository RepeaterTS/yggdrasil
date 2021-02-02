import msal from '@azure/msal-node';
import xboxlive from '@xboxreplay/xboxlive-auth';

import { CacheManager } from "../../../Cache/CacheManager";

/**
 * 
 */

export default class DeviceCodeAuthentication extends CacheManager {

    constructor(options: { username: string, password: string, cacheDirectory?: string }, private readonly callback?: Function) { 
        super(options.cacheDirectory);

        if (!options || !options?.username) throw new Error('You must pass a username at minimum to be used with Microsoft Device Authentication.')
    }



}
// Feburary 2nd, 2021 at 2:07am PST - Kashall and Rob9315

/**So how are we designating file names? email or the part before @? or what ever username they have on the account? 
// maybe uuid?
// probably better

I agree
lets just leave this in lol
So we really dont ever save anything until we've completed the full auth.
k
*/

// TODO: Spam Later...  callback?.();
