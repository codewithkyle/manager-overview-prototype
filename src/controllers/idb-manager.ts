import { v4 as uuid } from "uuid";
import noop from "../utils/noop";

class IDBManager {
    private queue: Array<any>;
	private ready: boolean;
    private worker: Worker;
    private promises: {
		[key: string]: {
            success: Function;
            fail: Function;
        }
	};

    constructor(){
        this.ready = false;
        this.queue = [];
        this.promises = {};
        this.worker = new Worker("/js/idb-worker.js");
        this.worker.onmessage = this.inbox.bind(this);
    }

    private inbox(e:MessageEvent):void{
        const { type, uid, data } = e.data;
        switch (type){
            case "error":
                if (this.promises?.[uid]) {
					this.promises[uid].fail(data);
					delete this.promises[uid];
				}
                break;
            case "response":
				if (this.promises?.[uid]) {
					this.promises[uid].success(data);
					delete this.promises[uid];
				}
				break;
            case "ready":
				this.flushQueue();
				break;
            default:
                console.warn(`Unknown IDB Worker response message type: ${type}`);
                break;
        }
    }

    private flushQueue() {
		this.ready = true;
		for (let i = this.queue.length - 1; i >= 0; i--) {
			this.worker.postMessage(this.queue[i]);
			this.queue.splice(i, 1);
		}
	}

    public send(type: string, data: any = null, resolve: Function = noop, reject:Function = noop) {
		const messageUid = uuid();
		const message = {
			type: type,
			data: data,
			uid: messageUid,
		};
        this.promises[messageUid] = {
            success: resolve,
            fail: reject
        };
		if (this.ready) {
			this.worker.postMessage(message);
		} else {
			this.queue.push(message);
		}
	}
}
const idb = new IDBManager();
export default idb;