const http = require('http');
const express = require('express');
const app = express();
app.use(express.static('public'));
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const httpServer = http.createServer(app);
httpServer.listen(5001);
const path = require("path");
const cwd = process.cwd();

const { buildSuccessResponse, buildErrorResponse, clone } = require("./utils");
const CommandCenter = require("./command-center");

app.get("/*", async (req, res) => {
    return res.sendFile(path.join(cwd, "public", "index.html"));
});