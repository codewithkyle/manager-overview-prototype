import cc from "./control-center";
import { toast } from "@codewithkyle/notifyjs";

let socket;

function reconnect(){
    socket = new WebSocket('ws://localhost:5002');
    socket.addEventListener('message', (event) => {
        try {
            const op = JSON.parse(event.data);
            localStorage.setItem("ledger-etag", op.etag);
            cc.perform(op, true);
        } catch (e) {
            console.error(e, event);
        }
    });
    socket.addEventListener("close", () => {
        toast({
            title: "Connection Lost",
            message: "You've lost your connection with the server. Any new changes you make will not be applied until you've reconnected.",
            classes: ["-yellow"],
            closeable: true,
            duration: Infinity,
        });
        setTimeout(() => {
            reconnect();
        }, 30000);
    });
    socket.addEventListener("open", () => {
        cc.sync();
    });
}
reconnect();