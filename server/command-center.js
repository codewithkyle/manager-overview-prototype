const { broadcast } = require("./websockets");
const db = require("./db");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid").v4;

const ledgerFile = path.join(__dirname, "ledger.ndjson");
const tempLedgerFile = path.join(__dirname, "ledger.tmp");

class CommandCenter {
    constructor(){
        this.ledger = [];
        this.ops = {};
        if (fs.existsSync(ledgerFile)){
            fs.unlinkSync(ledgerFile);
        }
        fs.writeFileSync(ledgerFile, "");
        this.opsSinceLastNormalize = 0;
        this.normalizing = false;
        this.lastNormalizeTimestamp = 0;
    }

    async op(operation){
        if (operation.id in this.ops || operation.timestamp <= this.lastNormalizeTimestamp){
            return;
        }
        this.ops[operation.id] = 1;
        await this.logOP(operation);
        const { size, mtimeMs } = await fs.promises.stat(ledgerFile);
        operation.etag = `${size}-${mtimeMs}`;
        this.ledger.push(operation);
        broadcast(operation);
        await this.getOPs(operation);
        this.opsSinceLastNormalize++;
        if (this.opsSinceLastNormalize >= 10000){
            this.normalize();
        }
    }

    async normalize(){
        this.normalizing = true;
        this.opsSinceLastNormalize = 0;
        this.lastNormalizeTimestamp = new Date().getTime();
        this.ledger.splice(0, this.ledger.length);
        if (fs.existsSync(tempLedgerFile)){
            await fs.promises.unlink(tempLedgerFile);
        }
        await fs.promises.writeFile(tempLedgerFile, "");
        const temp = path.join(__dirname, `${uuid()}.tmp`);
        await fs.promises.writeFile(temp, "");
        const stream = fs.createWriteStream(temp, { flags: "a"});
        const tasks = db.select("tasks");
        const ops = [];
        for (let i = 0; i < tasks.length; i++){
            const task = tasks[i];
            ops.push({
                id: uuid(),
                op: "INSERT",
                table: "tasks",
                key: task.uid,
                value: task,
                timestamp: this.lastNormalizeTimestamp,
            });
        }
        for (let i = 0; i < ops.length; i++){
            stream.write(`${JSON.stringify(ops[i])}\n`);
        }
        const tempLedgerData = await fs.promises.readFile(tempLedgerFile, "utf-8");
        stream.write(tempLedgerData);
        stream.end();
        this.ledger = [...ops, ...this.ledger];
        fs.renameSync(temp, ledgerFile);
        this.normalizing = false;
    }

    logOP(operation){
        return new Promise(resolve => {
            let stream;
            if (this.normalizing){
                stream = fs.createWriteStream(tempLedgerFile, { flags: 'a' });
            } else {
                stream = fs.createWriteStream(ledgerFile, { flags: 'a' });
            }
            stream.write(`${JSON.stringify(operation)}\n`, () => {
                resolve();
            });
        });
    }

    getOPsById(id){
        let index = -1;
        let output = [];
        for (let i = this.ledger.length - 1; i >= 0; i--){
            if (this.ledger[i].id === id){
                index = i + 1;
                break;
            }
        }
        if (index === -1){
            throw 404;
        } else {
            output = this.ledger.slice(index, this.ledger.length);
        }
        return output;
    }

    async getOPs(operation){
        const { op, id, table, key, value, keypath, timestamp } = operation;
        const history = [...this.ledger];
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