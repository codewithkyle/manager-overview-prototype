const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const httpServer = http.createServer(app);
httpServer.listen(5003);
const path = require("path");
const cwd = process.cwd();
const fs = require("fs");

const { buildSuccessResponse, buildErrorResponse, clone } = require("./utils");
const CommandCenter = require("./command-center");
const ledgerFile = path.join(__dirname, "ledger.ndjson");

app.post("/api/v1/op", async (req, res) => {
    try {
        await CommandCenter.op(req.body);
        res.status(200).send(buildSuccessResponse());
    } catch (e) {
        console.log(e);
        switch (e) {
            case 401:
                return res
                    .status(401)
                    .json(
                        buildErrorResponse(
                            "You are not authorized to perform this action."
                        )
                    );
            default:
                return res
                    .status(500)
                    .json(buildErrorResponse("Server error occurred."));
        }
    }
});

app.head("/api/v1/ledger", (req, res) => {
    const { size, mtimeMs } = fs.statSync(ledgerFile);
    res.set("ETag", `${size}-${mtimeMs}`).status(200).send();
});

app.get("/api/v1/ledger", async (req, res) => {
    try {
        res.status(200).sendFile(ledgerFile);
    } catch (e) {
        switch (e) {
            case 401:
                return res
                    .status(401)
                    .json(
                        buildErrorResponse(
                            "You are not authorized to perform this action."
                        )
                    );
            default:
                return res
                    .status(500)
                    .json(buildErrorResponse("Server error occurred."));
        }
    }
});

app.get("/api/v1/sync", async (req, res) => {
    try {
        const { id } = req.query;
        const data = CommandCenter.getOPsById(id);
        res.status(200).json(buildSuccessResponse(data));
    } catch (e) {
        switch (e) {
            case 404:
                return res
                    .status(404)
                    .json(
                        buildErrorResponse(
                            "Operations are out of bounds due to data normalization."
                        )
                    );
            case 401:
                return res
                    .status(401)
                    .json(
                        buildErrorResponse(
                            "You are not authorized to perform this action."
                        )
                    );
            default:
                return res
                    .status(500)
                    .json(buildErrorResponse("Server error occurred."));
        }
    }
});

app.get("/js/*", async (req, res) => {
    return res.sendFile(path.join(__dirname, "../", "public", req.path));
});

app.get("/css/*", async (req, res) => {
    return res.sendFile(path.join(__dirname, "../", "public", req.path));
});

app.get("/*", async (req, res) => {
    const requestedFilePath = path.join(__dirname, "../", "public", req.path);
    if (fs.existsSync(requestedFilePath)) {
        return res.sendFile(requestedFilePath);
    }
    return res.sendFile(path.join(__dirname, "../", "public", "index.html"));
});
