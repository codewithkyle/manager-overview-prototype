class Database {
    constructor(){
        this.users = {};
        this.tasks = {};
    }
    select(table){
        const output = [];
        switch (table){
            case "users":
                for (const key in this.users){
                    output.push(this.users[key]);
                }
                return output;
            case "tasks":
                for (const key in this.tasks){
                    output.push(this.tasks[key]);
                }
                return output;
            default:
                return;
        } 
    }
    unset({ op, id, table, key, value, keypath, timestamp }){
        switch (table){
            case "users":
                if (this.users?.[key]){
                    this.unsetValueFromKeypath(this.users[key], keypath.split("::"));
                }
                return;
            case "tasks":
                if (this.tasks?.[key]){
                    this.unsetValueFromKeypath(this.tasks[key], keypath.split("::"));
                }
                return;
            default:
                return;
        }
    }
    set({ op, id, table, key, value, keypath, timestamp }){
        switch (table){
            case "users":
                if (this.users?.[key]){
                    this.setValueFromKeypath(this.users[key], keypath.split("::"), value);
                }
                return;
            case "tasks":
                if (this.tasks?.[key]){
                    this.setValueFromKeypath(this.tasks[key], keypath.split("::"), value);
                }
                return;
            default:
                return;
        }
    }
    insert({ op, id, table, key, value, keypath, timestamp }){
        switch (table){
            case "users":
                this.users[key] = value;
                return;
            case "tasks":
                this.tasks[key] = value;
                return;
            default:
                return;
        }
    }
    delete({ op, id, table, key, value, keypath, timestamp }){
        switch (table){
            case "users":
                if (key in this.users){
                    delete this.users[key];
                }
                return;
            case "tasks":
                if (key in this.tasks){
                    delete this.tasks[key];
                }
                return;
            default:
                return;
        }
    }
    setValueFromKeypath(object, keypath, value){
        const key = keypath[0];
        keypath.splice(0, 1);
        if (keypath.length && object?.[key]){
            setValueFromKeypath(object[key], keypath, value);
        } else {
            object[key] = value;
        }
    }
    unsetValueFromKeypath(object, keypath){
        const key = keypath[0];
        keypath.splice(0, 1);
        if (keypath.length && object?.[key]){
            unsetValueFromKeypath(object[key], keypath);
        } else {
            if (object?.[key]){
                delete object[key];
            }
        }
    }
}
const db = new Database();
module.exports = db;