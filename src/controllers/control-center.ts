import { v4 as uuid } from "uuid";
import { Delete, Insert, OPCode, Set, Unset } from "../types/ops";
import idb from "./idb-manager";
import { createSubscription, publish } from "@codewithkyle/pubsub";

class ControlCenter {

    constructor(){
        createSubscription("sync");
    }

    public insert(table:string, key:string, value:any):Insert{
        return {
            id: uuid(),
            op: "INSERT",
            table: table,
            key: key,
            value: value,
            timestamp: new Date().getTime(),
        };
    }

    public async delete(table:string, key:string):Promise<Delete>{
        const value = await new Promise(resolve => {
            idb.send("GET", {
                table: table,
                key: key,
            }, resolve);
        });
        return {
            id: uuid(),
            op: "DELETE",
            table: table,
            key: key,
            timestamp: new Date().getTime(),
        };
    }

    public set(table:string, key:string, keypath:string, value:any):Set{
        return {
            id: uuid(),
            op: "SET",
            table: table,
            key: key,
            keypath: keypath,
            value: value,
            timestamp: new Date().getTime(),
        };
    }

    public unset(table:string, key:string, keypath:string):Unset{
        return {
            id: uuid(),
            op: "UNSET",
            table: table,
            key: key,
            keypath: keypath,
            timestamp: new Date().getTime(),
        };
    }

    public async disbatch(op:OPCode){
        try{
            const request = await fetch("/api/v1/op", {
                method: "POST",
                headers: new Headers({
                    Accept: "application/json",
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify(op),
            });
            const response = await request.json();
            if (!request.ok || !response?.success){
                console.error(response?.error ?? request.statusText);
                // TODO: determine the proper server error handling procedure
            }
        } catch (e) {
            console.error(e);
            // TODO: handle network error by queuing the request
        }
    }

    public async perform(operation:OPCode, disbatchToUI = false){
        try {
            // @ts-ignore
            const { op, id, table, key, value, keypath, timestamp } = operation;

            // Ignore web socket OPs if they originated from this client
            const alreadyInLedger = await new Promise(resolve => {
                idb.send("GET", {
                    table: "ledger",
                    key: id,
                }, resolve);
            });
            if (alreadyInLedger){
                return;
            }

            // Insert OP into the ledger
            await new Promise(resolve => {
                idb.send("INSERT", {
                    table: "ledger",
                    key: id,
                    value: operation,
                }, resolve);
            });

            // Get all past operations & select ops to be performed
            const history:Array<OPCode> = await new Promise(resolve => {
                idb.send("SELECT", {
                    table: "ledger",
                }, resolve);
            });
            history.sort((a, b) => {
                return a.timestamp - b.timestamp > 0 ? 1 : -1;
            });
            let startAtIndex = null;
            for (let i = history.length - 1; i >= 0; i--){
                if (startAtIndex === null && history[i].timestamp === timestamp){
                    startAtIndex = i;
                } else if (startAtIndex !== null) {
                    if (history[i].timestamp === timestamp){
                        startAtIndex = i;
                        // TODO: handle possible conflicts
                    } else {
                        break;
                    }
                }
            }
            const ops = history.splice(startAtIndex);

            // Perform ops
            for (const op of ops){
                await this.op(op);
                if (disbatchToUI){
                    publish("sync", op);
                }
            }
        } catch (e) {
            console.error(e);
            // TODO: handle desync
        }
    }

    public setValueFromKeypath(object, keypath, value){
        const key = keypath[0];
        keypath.splice(0, 1);
        if (keypath.length){
            this.setValueFromKeypath(object[key], keypath, value);
        } else {
            object[key] = value;
        }
    }
    
    public unsetValueFromKeypath(object, keypath){
        const key = keypath[0];
        keypath.splice(0, 1);
        if (keypath.length){
            this.unsetValueFromKeypath(object[key], keypath);
        } else {
            delete object[key];
        }
    }

    private async op(operation){
        try {
            // @ts-ignore
            const { op, id, table, key, value, keypath, timestamp } = operation;
            switch (op){
                case "INSERT":
                    return new Promise((resolve, reject) => {
                        idb.send("INSERT", {
                            table: table,
                            value: value,
                        }, resolve, reject);
                    });
                case "DELETE":
                    return new Promise((resolve, reject) => {
                        idb.send("DELETE", {
                            table: table,
                            key: key,
                        }, resolve, reject);
                    });
                case "SET":
                    return new Promise((resolve, reject) => {
                        idb.send("SET", {
                            table: table,
                            key: key,
                            keypath: keypath,
                            value: value,
                        }, resolve, reject);
                    });
                case "UNSET":
                    return new Promise((resolve, reject) => {
                        idb.send("UNSET", {
                            table: table,
                            key: key,
                            keypath: keypath,
                        }, resolve, reject);
                    });
                default:
                    console.error(`Unknown OP: ${op}`);
                    break;
            }
        } catch (e) {
            console.error(e);
            // TODO: handle desync
        }
    }
}
const cc = new ControlCenter();
export default cc;