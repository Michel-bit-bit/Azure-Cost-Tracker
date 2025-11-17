
import { CostEntry } from '../types';

const DB_NAME = 'AzureCostTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'costEntries';

class IndexedDBService {
    private db: IDBDatabase | null = null;

    constructor() {
        this.initDB();
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                return resolve(this.db);
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("Erreur d'ouverture de la base de données");
                reject("Erreur d'ouverture de la base de données");
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    private async getObjectStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        const db = await this.initDB();
        const transaction = db.transaction(STORE_NAME, mode);
        return transaction.objectStore(STORE_NAME);
    }
    
    async addEntry(entry: Omit<CostEntry, 'id'>): Promise<void> {
        const store = await this.getObjectStore('readwrite');
        const request = store.add(entry);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Erreur lors de l'ajout de l'entrée");
        });
    }

    async getAllEntries(): Promise<CostEntry[]> {
        const store = await this.getObjectStore('readonly');
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Erreur lors de la récupération des entrées");
        });
    }
    
    async updateEntry(entry: CostEntry): Promise<void> {
        const store = await this.getObjectStore('readwrite');
        const request = store.put(entry);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Erreur lors de la mise à jour de l'entrée");
        });
    }

    async deleteEntry(id: number): Promise<void> {
        const store = await this.getObjectStore('readwrite');
        const request = store.delete(id);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Erreur lors de la suppression de l'entrée");
        });
    }

    async exportData(): Promise<string> {
        const entries = await this.getAllEntries();
        return JSON.stringify(entries, null, 2);
    }

    async importData(jsonString: string): Promise<void> {
        const entries: CostEntry[] = JSON.parse(jsonString);
        const store = await this.getObjectStore('readwrite');
        const clearRequest = store.clear();

        return new Promise((resolve, reject) => {
            clearRequest.onsuccess = () => {
                const addPromises = entries.map(entry => {
                    // IndexedDB gère l'auto-incrémentation, donc on ne passe pas l'id
                    const { id, ...entryWithoutId } = entry;
                    return new Promise<void>((res, rej) => {
                        const addReq = store.add(entryWithoutId);
                        addReq.onsuccess = () => res();
                        addReq.onerror = () => rej();
                    });
                });
                Promise.all(addPromises).then(() => resolve()).catch(() => reject("Erreur lors de l'importation de certaines entrées"));
            };
            clearRequest.onerror = () => reject("Erreur lors du nettoyage de la base de données");
        });
    }
}

export const db = new IndexedDBService();
