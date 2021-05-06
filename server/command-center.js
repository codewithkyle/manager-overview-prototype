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
    }

    async op(operation){
        if (operation.id in this.ops){
            return;
        }
        this.opsSinceLastNormalize++;
        this.ops[operation.id] = 1;
        this.logOP(operation);
        const { size, mtimeMs } = await fs.promises.stat(ledgerFile);
        operation.etag = `${size}-${mtimeMs}`;
        broadcast(operation);
        this.ledger.push(operation);
        this.ledger.sort((a, b) => {
            return a.timestamp - b.timestamp > 0 ? 1 : -1;
        });
        await this.getOPs(operation);
        if (this.opsSinceLastNormalize >= 100){
            this.normalize();
        }
    }

    async normalize(){
        this.normalizing = true;
        this.opsSinceLastNormalize = 0;
        this.ledger.splice(0, this.ledger.length - 1);
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
                timestamp: 0,
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
        let stream;
        if (this.normalizing){
            stream = fs.createWriteStream(tempLedgerFile, { flags: 'a' });
        } else {
            stream = fs.createWriteStream(ledgerFile, { flags: 'a' });
        }
        stream.write(`${JSON.stringify(operation)}\n`);
        stream.end();
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