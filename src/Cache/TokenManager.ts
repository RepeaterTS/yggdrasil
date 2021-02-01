import { dir } from 'console'
import { CacheManager } from './CacheManager'

export class TokenManager extends CacheManager {
    constructor(directory?: string) {
        super(directory)
    }
}