import dotenv from 'dotenv';
import path from 'path';
const __dirname = import.meta.dirname;
import fs from 'fs';

dotenv.config({
    path: [
        path.join(__dirname, "env.env"),
        path.join(__dirname, "secrets", "keys.env"),
    ],
});

const _config = {
    cookieOptions: {
        maxAge: 1000 * 60 * 60,
        secure: true,
        signed: true,
        sameSite: "strict",
        httpOnly: false, // TODO set true and test logout
        partitioned: true,
    },

    port: process.env.PORT,
    cookieKey: process.env.COOKIE_KEY,

    credentials: {
        key: fs.readFileSync(path.join(__dirname, "secrets", "self.key")),
        cert: fs.readFileSync(path.join(__dirname, "secrets", "self.crt")),
    },

    dbName: "data.db",

    saltRounds: 12,

    corsConfig: {
        credentials: true,
        origin: true,
    },

    tokenDuration: 1 * 60 * 60 * 100,

    // all, important, none
    err2Level: "all",
}

if (!_config.port || !_config.cookieKey) {
    throw new Error("env files not properly configured: did you forget something?");
}


if (!["all", "important", "none"].includes(_config.err2Level)) {
    throw new Error(`Invalid err2Level: "${_config.err2Level}"`);
}

// In the future this can return a copy
export default function config() {
    return _config;
}

