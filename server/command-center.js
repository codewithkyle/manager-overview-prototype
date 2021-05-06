const { broadcast } = require("./websockets");
const db = require("./db");
const fs = require("fs");
const path = require("path");

const ledgerFile = path.join(__dirname, "ledger.ndjson");

class CommandCenter {
    constructor(){
        this.ledger = [];
        this.ops = {};
        if (fs.existsSync(ledgerFile)){
            fs.unlinkSync(ledgerFile);
        }
        fs.writeFileSync(ledgerFile, "");
    }

    async op(operation){
        if (operation.id in this.ops){
            return;
        }
        this.ops[operation.id] = 1;
        await this.logOP(operation);
        const { size, mtimeMs } = await fs.promises.stat(ledgerFile);
        operation.etag = `${size}-${mtimeMs}`;
        broadcast(operation);
        this.ledger.push(operation);
        this.ledger.sort((a, b) => {
            return a.timestamp - b.timestamp > 0 ? 1 : -1;
        });
        await this.getOPs(operation);
    }

    logOP(operation){
        return new Promise(resolve => {
            const stream = fs.createWriteStream(ledgerFile, { flags: 'a' });
            stream.write(`${JSON.stringify(operation)}\n`, () => {
                resolve();
            });
        })
    }

    async getOPs(operation){
        const { op, id, table, key, value, keypath, timestamp } = operation;
        const history = [...this.ledger];
        let startAtIndex = null;
        for (let i = history.length - 1; i >= 0; i--){
            if (startAtIndex === null && history[i].timestamp === timestamp){
                startAtIndex = i;
            } else if (startAtIndex !== null) {
                if (history[i].timestamp === timestamp){
                    startAtIndex = i;
                } else {
                    break;
                }
            }
        }
        const ops = history.splice(startAtIndex);
        for (const op of ops){
            await this.perform(op);
        }
    }

    async perform(operation){
        const { op, id, table, key, value, keypath, timestamp } = operation;
        switch (op){
            case "UNSET":
                db.unset(operation);
                break;
            case "SET":
                db.set(operation);
                break;
            case "DELETE":
                db.delete(operation);
                break;
            case "INSERT":
                db.insert(operation);
                break;
            default:
                return;
        }
    }
}
const command = new CommandCenter();
module.exports = command;