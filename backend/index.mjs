import express, { query } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { getCookieOptions } from './misc.js';
import queries from './database.mjs';

const __dirname = import.meta.dirname;

// Configure environment

dotenv.config({
    path: [
        path.join(__dirname, "config.env"),
        path.join(__dirname, "secrets", "keys.env"),
    ],
});

const PORT = process.env.PORT;
const COOKIE_KEY = process.env.COOKIE_KEY;

console.log(`Using port ${PORT}`);
console.log(`Cookie signing key is ${COOKIE_KEY}`);

if (!PORT || !COOKIE_KEY) {
    throw new Error("env files not properly configured: did you forget something?");
}

const credentials = {
    key: fs.readFileSync(path.join(__dirname, "secrets", "self.key")),
    cert: fs.readFileSync(path.join(__dirname, "secrets", "self.crt")),
};

const app = express();

// Configure middleware
app.use(cors({
    credentials: true,
    origin: true,
}));
app.use(bodyParser.json());
app.use(cookieParser(COOKIE_KEY));

const db = queries.db;

function refreshCookie(res, username) {
    res.cookie("token", {username: username, time: Date.now()}, getCookieOptions());
}

function authMW(req, res, next) {
    const token = req.signedCookies.token;

    if (!token || !token.time || !token.username) {
        res.statusCode = 401;
        res.send("Bad auth token");
    }

    // Tokens are valid for 1 hour
    if (token.time + 1 * 60 * 60 * 1000 < Date.now()) {
        res.statusCode = 401;
        return;
    }

    next();
}

app.use("/api", authMW);

app.get("/api/test", (req, res) => {
    console.log("reached API");
    res.send("reached API");
});

app.get("/info", (req, res) => {
    console.log(req.signedCookies);
    res.json({token: req.signedCookies.token});
});

app.post("/register", (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    console.log(`Got register request: ${username} ${password}`);

    if (typeof(username) !== "string" || typeof(password) !== "string") {
        res.statusCode = 400;
        res.end();
    }

    queries.register(username, password)
    .then(() => {
        res.send("Registration succeeded");
    })
    .catch(() => {
        res.statusCode = 400;
        res.send("Registration failed");
    });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log(`Got login request ${username} ${password}`);

    if (typeof(username) !== "string" || typeof(password) !== "string") {
        res.statusCode = 400;
        res.end();
    }

    queries.authenticate(username, password)
    .then(() => {
        refreshCookie(res, username);
        res.send("Logged in successfully");
    })
    .catch(() => {
        res.statusCode = 400;
        res.send("Login failed");
    });

});


// Start server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
    console.log("HTTPS server is running");
});
