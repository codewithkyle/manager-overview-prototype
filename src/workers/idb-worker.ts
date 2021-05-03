self.importScripts("/js/idb.js");

type Schema = {
	version: number;
	tables: Array<Table>;
};

type Table = {
	name: string;
	columns: Array<Column>;
	keyPath?: string;
	autoIncrement?: boolean;
	ingestURL?: string;
};

type Column = {
	key: string;
	unique?: boolean;
};

const DB_NAME = "application";

class IDBWorker {
    private db:any;

    constructor(){
        self.onmessage = this.inbox.bind(this);
        this.init();
    }

    private inbox(e:MessageEvent){
        const { type, uid, data } = e.data;
        switch (type){
            case "UNSET":
                this.unset(data).then(() => {
                    this.send("response", null, uid);
                });
                break;
            case "SET":
                this.set(data).then(() => {
                    this.send("response", null, uid);
                });
                break;
            case "DELETE":
                this.delete(data).then(() => {
                    this.send("response", null, uid);
                });
                break;
            case "GET":
                this.get(data).then(output => {
                    this.send("response", output, uid);
                });
                break;
            case "SELECT":
                this.select(data).then((output)=>{
                    this.send("response", output, uid);
                });
                break;
            case "INSERT":
                this.insert(data).then(()=>{
                    this.send("response", null, uid);
                }).catch(error => {
                    this.send("error", error, uid);
                });
                break;
            default:
                console.warn(`Invalid IDB Worker message type: ${type}`);
                break;
        }
    }

    private send(type: string, data: any = null, uid: string = null, origin = null) {
		const message = {
			type: type,
			data: data,
			uid: uid,
		};
		if (origin) {
			self.postMessage(message, origin);
		} else {
			// @ts-expect-error
			self.postMessage(message);
		}
	}

    private setValueFromKeypath(object, keypath, value){
        const key = keypath[0];
        keypath.splice(0, 1);
        if (keypath.length){
            this.setValueFromKeypath(object[key], keypath, value);
        } else {
            object[key] = value;
        }
    }

    private unsetValueFromKeypath(object, keypath){
        const key = keypath[0];
        keypath.splice(0, 1);
        if (keypath.length){
            this.unsetValueFromKeypath(object[key], keypath);
        } else {
            delete object[key];
        }
    }

    private async unset({ table, key, keypath }){
        keypath = keypath.split("::");
        const data = await this.db.get(table, key);
        if (data){
            this.unsetValueFromKeypath(data, keypath);
            await this.db.put(table, data);
        }
    }

    private async set({ table, key, keypath, value }){
        keypath = keypath.split("::");
        const data = await this.db.get(table, key);
        if (data){
            this.setValueFromKeypath(data, keypath, value);
            await this.db.put(table, data);
        }
    }

    private async delete({ table, key }){
        await this.db.delete(table, key);
    }

    private async select({ table }){
        const lists = await this.db.getAll(table);
        return lists;
    }

    private async insert({ table, value }){
        await this.db.put(table, value);
    }

    private async get({ table, key }){
        const data = await this.db.get(table, key);
        return data;
    }

    private async init(){
        try {
			const request = await fetch(`/schema.json`);
			const scheam: Schema = await request.json();
			// @ts-expect-error
			this.db = await openDB(DB_NAME, scheam.version, {
				upgrade(db, oldVersion, newVersion, transaction) {
					// Purge old stores so we don't brick the JS runtime VM when upgrading
					for (let i = 0; i < db.objectStoreNames.length; i++) {
						db.deleteObjectStore(db.objectStoreNames[i]);
					}

					for (let i = 0; i < scheam.tables.length; i++) {
						const table: Table = scheam.tables[i];
						const options = {
							keyPath: "id",
							autoIncrement: false,
						};
						if (table?.keyPath) {
							options.keyPath = table.keyPath;
						}
						if (typeof table.autoIncrement !== "undefined") {
							options.autoIncrement = table.autoIncrement;
						}
						const store = db.createObjectStore(table.name, options);
						for (let k = 0; k < table.columns.length; k++) {
							const column: Column = table.columns[k];
							store.createIndex(column.key, column.key, {
								unique: column?.unique ?? false,
							});
						}
					}
				},
				blocked() {
					this.send("error", "This app needs to restart. Close all tabs for this app and before relaunching.");
				},
				blocking() {
					this.send("error", "This app needs to restart. Close all tabs for this app before relaunching.");
				},
			});
			this.send("ready");
		} catch (e) {
			console.error(e);
		}
    }
}
new IDBWorker();