import { resolve, dirname } from 'path';
import { promises as fsp } from 'fs';
import fs from 'fs-nextra';
import { mergeObjects, chunk } from '@repeaterts/utilities'

import { cacheLocation } from '../Util/Util'

export class CacheManager {

    private readonly baseDirectory: string;

    constructor(directory?: string) {
        this.baseDirectory = resolve(directory ?? dirname(require.main?.filename as string), 'cache') ?? cacheLocation() ?? '.'
    }

    /**
    * Ensures the manager's directory exists.
    */
    public async init(): Promise<void> {
        await fs.ensureDir(this.baseDirectory).catch((err) => console.error(err));
    }

    /* Document Methods */

    /**
    * Get all documents from a directory.
    * @param entries The entries to download, defaults to all keys in the directory
     */
    public async getAll(entries: string[]): Promise<unknown[]> {
        if (!Array.isArray(entries) || !entries.length) entries = await this.getKeys();
        if (entries.length < 5000) {
            return (await Promise.all(entries.map(this.get.bind(this)))).filter(value => value) as unknown[];
        }

        const parts = chunk(entries, 5000);
        const output = [];
        for (const part of parts) output.push(...await Promise.all(part.map(this.get.bind(this))));
        return output.filter(value => value) as unknown[];
    }

    /**
    * Get all document names from a directory, filter by json.
    */
    public async getKeys(): Promise<string[]> {
        const dir = resolve(this.baseDirectory);
        const filenames = await fsp.readdir(dir);
        const files = [];
        for (const filename of filenames) {
            if (filename.endsWith('.json')) files.push(filename.slice(0, filename.length - 5));
        }
        return files;
    }

    /**
    * Get a document from a directory.
    * @param id The document name
    */
    public async get(id: string): Promise<unknown | null> {
        try {
            return await fs.readJSON(resolve(this.baseDirectory, `${id}.json`));
        } catch {
            return null;
        }
    }

    /**
    * Check if the document exists.
    * @param id The document name
    */
    public has(id: string): Promise<boolean> {
        return fs.pathExists(resolve(this.baseDirectory, `${id}.json`));
    }

    /**
	 * Insert a new document into a directory.
	 * @param id The document name
	 * @param data The unknown with all properties you want to insert into the document
	 */
    public async create(username: string, data: object = {}): Promise<void> {
        await fs.outputJSONAtomic(resolve(this.baseDirectory, `${username}.json`), { username, ...data })
    }

    /**
    * Update a document from a directory.
    * @param id The document name
    * @param data The unknown with all the properties you want to update
    */
    public async update(id: string, data: unknown): Promise<void> {
        const existent = await this.get(id) as Record<PropertyKey, unknown> | null;
        await fs.outputJSONAtomic(resolve(this.baseDirectory, `${id}.json`), mergeObjects(existent ?? { id }, data));
    }

    /**
     * Replace all the data from a document.
     * @param id The document name
     * @param data The new data for the document
     */
    public async replace(id: string, data: object = {}): Promise<void> {
        await fs.outputJSONAtomic(resolve(this.baseDirectory, `${id}.json`), { id, ...data });
    }

    /**
    * Delete a document from the cache.
    * @param id The document name
    */
    public async delete(id: string): Promise<void> {
        await fsp.unlink(resolve(this.baseDirectory, `${id}.json`));
    }

}