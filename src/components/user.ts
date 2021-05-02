import { html, render } from "lit-html";
import SuperComponet from "@codewithkyle/supercomponent";
import type { IUser } from "../types/user";

import Task from "./task";
customElements.define("task-component", Task);

export default class User extends SuperComponet<IUser>{
    constructor(user:IUser){
        super();
        this.model = user;
        this.render();
    }

    private createTask:EventListener = () => {
        const task = prompt("What is the task?");
        if (!task){
            return;
        }
    }

    render(){
        const view = html`
            <div class="avatar">
                <img src="${this.model.avatar}" alt="${this.model.name} profile photo">
            </div>
            <h2>${this.model.name}</h2>
            <div class="task-list">
                ${Object.keys(this.model.tasks).length ? Object.keys(this.model.tasks).map(uid => {
                    return new Task(this.model.tasks[uid], uid);
                }) : html`<p class="w-full block text-center font-sm line-normal mb-0.5">${this.model.name} doens't have any tasks.</p>`}
            </div>
            <button class="bttn w-full mt-1" shape="rounded" kind="solid" color="success" @click=${this.createTask}>Create Task</button>
        `;
        render(view, this);
    }
}