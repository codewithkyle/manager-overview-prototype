import { html, render } from "lit-html";

export default class Homepage extends HTMLElement{
    constructor(){
        super();
        this.init();
    }

    private async init(){
        // TODO: sync data with server
        this.render();
    }

    private render(){
        const view = html`
            <div class="w-full h-full" flex="items-center justify-center">
                <div class="block p-1 bg-white radius-0.5 shadow-md w-mobile max-w-full border-1 border-solid border-grey-300" grid="columns 2 gap-1">
                    Hello world!
                </div>
            </div>
        `;
        render(view, this);
    }
}