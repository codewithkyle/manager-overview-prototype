class Database {
    constructor(){
        this.users = {};
        this.tasks = {};
    }
    unset({ op, id, table, key, value, keypath, timestamp }){
        switch (table){
            case "users":
                this.unsetValueFromKeypath(this.users[key], keypath.split("::"));
                return;
            case "tasks":
                this.unsetValueFromKeypath(this.tasks[key], keypath.split("::"));
                return;
            default:
                return;
        }
    }
    set({ op, id, table, key, value, keypath, timestamp }){
        switch (table){
            case "users":
                this.setValueFromKeypath(this.users[key], keypath.split("::"), value);
                return;
            case "tasks":
                this.setValueFromKeypath(this.tasks[key], keypath.split("::"), value);
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
        if (keypath.length){
            setValueFromKeypath(object[key], keypath, value);
        } else {
            object[key] = value;
        }
    }
    unsetValueFromKeypath(object, keypath){
        const key = keypath[0];
        keypath.splice(0, 1);
        if (keypath.length){
            unsetValueFromKeypath(object[key], keypath);
        } else {
            delete object[key];
        }
    }
}
const db = new Database();
module.exports = db;