import cc from "./control-center";

const socket = new WebSocket('ws://localhost:5002');

socket.addEventListener('message', (event) => {
    try {
        const op = JSON.parse(event.data);
        cc.perform(op, true);
    } catch (e) {
        console.error(e);
    }
});