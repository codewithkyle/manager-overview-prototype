import { v4 as uuid } from "uuid";
import { Delete, Insert, OPCode } from "../types/ops";
import idb from "./idb-manager";

class ControlCenter {

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
            tombstone: value,
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

    public async perform(operation:OPCode){
        try {
            // @ts-ignore
            const { op, id, table, key, value, keypath, timestamp } = operation;

            // Insert OP into the ledger
            await new Promise(resolve => {
                idb.send("INSERT", {
                    table: "crdt-operations",
                    key: id,
                    value: operation,
                }, resolve);
            });

            // Get all past operations & select ops to be performed
            const history:Array<OPCode> = await new Promise(resolve => {
                idb.send("SELECT", {
                    table: "crdt-operations",
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
            }
        } catch (e) {
            console.error(e);
            // TODO: handle desync
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