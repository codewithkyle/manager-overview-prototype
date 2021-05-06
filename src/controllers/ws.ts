import cc from "./control-center";

let socket;

function reconnect(){
    socket = new WebSocket('ws://localhost:5002');
    socket.addEventListener('message', (event) => {
        try {
            const op = JSON.parse(event.data);
            cc.perform(op, true);
        } catch (e) {
            console.error(e, event);
        }
    });
    socket.addEventListener("close", () => {
        // TODO: notify user they've lost their internet connection
        setTimeout(() => {
            reconnect();
        }, 30000);
    });
    socket.addEventListener("open", () => {
        cc.sync();
    });
}
reconnect();