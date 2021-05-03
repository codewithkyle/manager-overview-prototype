import { html, render } from "lit-html";
import SuperComponet from "@codewithkyle/supercomponent";
import type { ITask } from "../types/user";

export default class Task extends SuperComponet<ITask>{
    private lastKey: string;

    constructor(task:ITask, uid){
        super();
        this.model = task;
        this.lastKey = "";
        this.render();
    }

    private handleTextInput: EventListener = (e:Event) => {
        // TODO: debounce & update
    }

    private handleKeypress = (e:KeyboardEvent) => {
        if (e instanceof KeyboardEvent){
            const key = e.key.toLowerCase();
            console.log(key);
            // TODO: if key = backspace && lastKey = tab delete the task
            this.lastKey = key;
        }
    }

    render(){
        const view = html`
            <input @keypress=${this.handleKeypress} @input=${this.handleTextInput} type="text" .value="${this.model.text}" title="${this.model.text}">
        `;
        render(view, this);
    }
}