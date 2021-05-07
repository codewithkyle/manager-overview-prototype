import cc from "./control-center";
import { toast } from "@codewithkyle/notifyjs";

let socket;
let connected = false;

function reconnect(){
    // socket = new WebSocket('ws://localhost:5004');
    socket = new WebSocket('ws://167.172.250.33:5004');
    socket.addEventListener('message', (event) => {
        try {
            const op = JSON.parse(event.data);
            localStorage.setItem("ledger-etag", op.etag);
            localStorage.setItem("last-op-id", op.id);
            cc.perform(op, true);
        } catch (e) {
            console.error(e, event);
        }
    });
    socket.addEventListener("close", () => {
        disconnect();
    });
    socket.addEventListener("open", () => {
        connected = true;
        cc.sync();
    });
}
reconnect();

function disconnect(){
    if (connected){
        toast({
            title: "Connection Lost",
            message: "You've lost your connection with the server. Any new changes you make will not be applied until you've reconnected.",
            classes: ["-yellow"],
            closeable: true,
            duration: Infinity,
        });
        connected = false;
    }
    setTimeout(() => {
        reconnect();
    }, 5000);
}
export { connected, disconnect };