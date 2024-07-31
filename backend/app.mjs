import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import config from './config.mjs';
import { toErr2 } from './database.mjs';

const app = express();

// Configure middleware
app.use(cors(config().corsConfig));
app.use(bodyParser.json());
app.use(cookieParser(config().cookieKey));

function refreshCookie(res, username) {
    res.cookie("token", {username: username, time: Date.now()}, config().cookieOptions);
}

function authMW(req, res, next) {
    const token = req.signedCookies.token;

    const invalidResponse = "invalid token";

    // missing token or parameters, or expired
    if (!token || !token.time || !token.username
            || token.time + config().tokenDuration < Date.now()) {

        res.statusCode = 401;
        res.send(invalidResponse);
        return;
    }

    next();
}

app.use("/api", authMW);

app.get("/api/test", (req, res) => {
    console.log("Reached /api/test");
    res.json({message: "Reached /api/test"});
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
        console.log("Invalid username/password types");
        return;
    }

    app.db.register(username, password)
    .then(() => {
        res.json({message: "Registration succeeded"});
    })
    .catch((err) => {
        const err2 = toErr2(err, "Couldn't register, try again later");
        err2.log();
        res.statusCode = 400;
        res.end();
    });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log(`Got login request ${username} ${password}`);

    if (typeof(username) !== "string" || typeof(password) !== "string") {
        res.statusCode = 400;
        res.end();
        return;
    }

    app.db.authenticate(username, password)
    .then(() => {
        refreshCookie(res, username);
        res.json({message: "Logged in successfully"});
    })
    .catch((err) => {
        const err2 = toErr2(err, "Credentials don't match");
        err2.log();

        res.statusCode = 400;
        res.end();
    });

});


export default app;
