const DB_NAME = 'molvicos_db';
const DB_VERSION = 1;
const STORES = {
	prompts: 'prompts',
	conversations: 'conversations',
	files: 'files'
};

function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = (e) => {
			const db = e.target.result;
			for (const name of Object.values(STORES)) {
				if (!db.objectStoreNames.contains(name)) {
					db.createObjectStore(name, { keyPath: 'id' });
				}
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export const idb = {
	async get(storeName, id) {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(storeName, 'readonly');
			const store = tx.objectStore(storeName);
			const req = store.get(id);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	},

	async getAll(storeName) {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(storeName, 'readonly');
			const store = tx.objectStore(storeName);
			const req = store.getAll();
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	},

	async put(storeName, data) {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName);
			const req = store.put(data);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	},

	async remove(storeName, id) {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName);
			const req = store.delete(id);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}
};

export { STORES };
