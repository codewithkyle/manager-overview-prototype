import { html, render } from "lit-html";
import SuperComponet from "@codewithkyle/supercomponent";
import type { ITask } from "../types/user";
import cc from "../controllers/control-center";
import debounce from "../utils/debounce";
import { subscribe, unsubscribe } from "@codewithkyle/pubsub";

export default class Task extends SuperComponet<ITask>{
    private tabDown: boolean;
    private inboxId: string;

    constructor(task:ITask){
        super();
        this.model = task;
        this.tabDown = false;
        this.inboxId = subscribe("sync", this.inbox.bind(this));
        this.render();
    }

    private inbox({ op, id, table, key, value, keypath, timestamp }){
        if (key === this.model.uid){
            switch (op){
                case "SET":
                    const updated = {...this.model};
                    cc.setValueFromKeypath(updated, keypath.split("::"), value);
                    this.update(updated);
                    break;
                default:
                    break;
            }
        }
    }

    disconnected(){
        unsubscribe(this.inboxId, "sync");
    }

    private async updateText(target:HTMLInputElement){
        const value = target.value;
        const op = await cc.set("tasks", this.model.uid, `text`, value);
        await cc.perform(op);
        cc.disbatch(op);
    }
    private debounceTextInput = debounce(this.updateText.bind(this), 600, false);
    private handleTextInput: EventListener = (e:Event) => {
        const target = e.currentTarget as HTMLInputElement;
        this.debounceTextInput(target);
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
                e.preventDefault();
                this.updateText = async () => {};
                const op = await cc.delete("tasks", this.model.uid);
                await cc.perform(op);
                cc.disbatch(op);
                // @ts-ignore
                this.closest("user-component").loadTasks();
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