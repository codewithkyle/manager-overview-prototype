const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5002 });

const clients = [];

function heartbeat() {
    this.isAlive = true;
}
function noop() {}

setInterval(function ping() {
    for (let i = clients.length - 1; i >= 0; i--){
        const ws = clients[i];
        if (ws.isAlive === false) {
            ws.terminate();
            clients.splice(i, 1);
        }
        ws.isAlive = false;
        ws.ping(noop);
    }
}, 30000);

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat.bind(ws));
    clients.push(ws);
});

function broadcast(op){
    clients.map(ws => {
        ws.send(JSON.stringify(op));
    });
}

module.exports = { broadcast };