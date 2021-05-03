import { html, render } from "lit-html";
import SuperComponet from "@codewithkyle/supercomponent";
import type { IUser } from "./types/user";

import User from "./components/user";
customElements.define("user-component", User);

type HomepageState = {
    users: {
        [uid:string]: IUser,
    },
};
export default class Homepage extends SuperComponet<HomepageState>{
    constructor(){
        super();
        this.model = {
            users: {
                "52f6cbc7-bb02-4e7f-98e8-86117255b3f8": {
                    uid: "52f6cbc7-bb02-4e7f-98e8-86117255b3f8",
                    name: "Mark Wheeler",
                    avatar: "/images/mark-wheeler.jpg",
                    tasks: {
                        "04a3d012-61de-49a5-9683-b60be7f11101": {
                            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
                        }
                    },
                },
                "09e27742-e186-4eca-946a-a1464e4da139": {
                    uid: "09e27742-e186-4eca-946a-a1464e4da139",
                    name: "April Farkas",
                    avatar: "/images/april-farkas.jpg",
                    tasks: {},
                },
                "9af42766-d845-4724-8d8d-a072f383295a": {
                    uid: "9af42766-d845-4724-8d8d-a072f383295a",
                    name: "Perry Wilson",
                    avatar: "/images/perry-wilson.jpg",
                    tasks: {},
                },
            },
        };
        this.init();
    }

    private async init(){
        // TODO: sync data with server
        this.render();
    }

    render(){
        const view = html`
            ${Object.keys(this.model.users).map(uid => {
                return new User(this.model.users[uid]);
            })}
        `;
        render(view, this);
    }
}