import { v4 as uuid } from "uuid";
import { Insert, OPCode } from "../types/ops";
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
            const { op, id, table, key, value, keypath } = operation;
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
        }
    }
}
const cc = new ControlCenter();
export default cc;