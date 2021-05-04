import { html, render } from "lit-html";
import SuperComponet from "@codewithkyle/supercomponent";
import type { ITask, IUser } from "../types/user";
import { v4 as uuid } from "uuid";
import cc from "../controllers/control-center";
import idb from "../controllers/idb-manager";
import { subscribe, unsubscribe } from "@codewithkyle/pubsub";

import Task from "./task";
customElements.define("task-component", Task);

export default class User extends SuperComponet<IUser>{
    private inboxId: string;

    constructor(user:IUser){
        super();
        this.model = user;
        this.inboxId = subscribe("sync", this.inbox.bind(this));
        this.loadTasks();
    }

    private inbox({ op, id, table, key, value, keypath, timestamp }){
        switch (op){
            case "DELETE":
                if (table === "tasks" && key in this.model.tasks){
                    this.loadTasks();
                }
                break;
            case "INSERT":
                if (table === "tasks" && value.user === this.model.uid){
                    this.loadTasks();
                }
                break;
            default:
                break;
        }
    }

    disconnected(){
        unsubscribe(this.inboxId, "sync");
    }

    public async loadTasks(){
        const tasks:Array<ITask> = await new Promise(resolve => {
            idb.send("FIND", {
                table: "tasks",
                index: "user",
                value: this.model.uid,
            }, resolve);
        });
        const updated = {...this.model};
        updated.tasks = {};
        for (let i = 0; i < tasks.length; i++){
            const task = tasks[i];
            updated.tasks[task.uid] = task;
        }
        this.update(updated);
    }

    private createTask:EventListener = async () => {
        const text = prompt("What's the task?");
        if (!text){
            return;
        }
        const uid = uuid();
        const op = cc.insert("tasks", uid, {
            uid: uid,
            user: this.model.uid,
            text: text,
        });
        await cc.perform(op);
        cc.disbatch(op);
        this.loadTasks();
    }

    render(){
        const view = html`
            <div class="avatar">
                <img src="${this.model.avatar}" alt="${this.model.name} profile photo">
            </div>
            <h2>${this.model.name}</h2>
            <div class="task-list">
                ${Object.keys(this.model.tasks).length ? Object.keys(this.model.tasks).map(uid => {
                    return new Task(this.model.tasks[uid]);
                }) : html`<p class="w-full block text-center font-sm line-normal mb-0.5">${this.model.name} doens't have any tasks.</p>`}
            </div>
            <button class="bttn w-full mt-1" shape="rounded" kind="solid" color="success" @click=${this.createTask}>Create Task</button>
        `;
        render(view, this);
    }
}