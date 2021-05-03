import { html, render } from "lit-html";
import SuperComponet from "@codewithkyle/supercomponent";
import type { ITask } from "../types/user";
import cc from "../controllers/control-center";

export default class Task extends SuperComponet<ITask>{
    private tabDown: boolean;

    constructor(task:ITask, uid){
        super();
        this.model = task;
        this.tabDown = false;
        this.render();
    }

    private handleTextInput: EventListener = (e:Event) => {
        // TODO: debounce & update
    }

    private handleKeydown = async (e:KeyboardEvent) => {
        if (e instanceof KeyboardEvent){
            const key = e.key.toLowerCase();
            switch (key){
                case "tab":
                    e.preventDefault();
                    this.tabDown = true;
                    break;
                default:
                    break;
            }
            if (this.tabDown && key === "backspace"){
                const op = await cc.delete("tasks", this.model.uid);
                await cc.perform(op);
                cc.disbatch(op);
                this.remove();
            }
        }
    }

    private handleKeyup = (e:KeyboardEvent) => {
        if (e instanceof KeyboardEvent){
            const key = e.key.toLowerCase();
            switch (key){
                case "tab":
                    this.tabDown = false;
                    break;
                default:
                    return;
            }
        }
    }

    render(){
        const view = html`
            <input @keyup=${this.handleKeyup} @keydown=${this.handleKeydown} @input=${this.handleTextInput} type="text" .value="${this.model.text}" title="${this.model.text}">
        `;
        render(view, this);
    }
}