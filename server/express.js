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

app.post("/api/v1/op", async (req, res) => {
    try{
        await CommandCenter.op(req.body);
        res.status(200).send(buildSuccessResponse());
    } catch (e) {
        console.log(e);
        switch(e){
            case 401:
                return res.status(401).json(buildErrorResponse("You are not authorized to perform this action."));
            default:
                return res.status(500).json(buildErrorResponse("Server error occurred."));
        }
    }
});

app.get("/*", async (req, res) => {
    return res.sendFile(path.join(cwd, "public", "index.html"));
});