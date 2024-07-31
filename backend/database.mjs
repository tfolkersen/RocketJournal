import sqlite3 from 'sqlite3';
import fs from 'fs';
import bcrypt from 'bcrypt';
import colors from './colors.mjs';
import config from './config.mjs';
sqlite3.verbose();

const initQueries = [
    `CREATE TABLE users (
        username TEXT PRIMARY KEY NOT NULL,
        hash TEXT NOT NULL
    );`,
];

class Err2 {
    constructor(privateErr, publicErr = null, important = true) {
        this.privateErr = privateErr;
        this.publicErr = publicErr;
        this.important = important;
    }

    log() {
        if (config().err2Level === "none") {
            return;
        }

        if (!this.important && config().err2Level === "important") {
            return;
        }

        let text = `${colors.yellow}{${colors.reset}\n`;

        text += (this.important ? colors.red : colors.purple) + `${this.privateErr}${colors.reset}\n`;


        text += `${colors.cyan}${this.publicErr}${colors.reset}\n`;

        text += `${colors.yellow}}${colors.reset}`;

        console.log(text);

    }
}

export function toErr2(err, defaultPublic = "Error") {
    if (Object.getPrototypeOf(err) === Err2.prototype) {
        if (err.publicErr === null || err.publicErr === undefined) {
            err.publicErr = defaultPublic;
        }
        return err;
    }

    return new Err2(err, defaultPublic, true);
}


async function getDB(dbName) {
    return new Promise(async (resolve1, reject1) => {
        let exists = false;

        if (dbName === ":memory:") {
            exists = false;
        } else {
            exists = fs.existsSync(dbName);
        }

        const db = new sqlite3.Database(dbName);
        db.serialize();

        let result = exists;

        if (!exists) {
            const promises = [];
            
            for (const query of initQueries) {
                promises.push(new Promise((resolve2, reject2) => { 
                    db.run(query, (err) => {
                        if (err) {
                            reject2(err);
                            return;
                        }

                        resolve2("Init query success!");
                        return;
                    });
                }));
            }

            result = await Promise.all(promises)
                .then(() => {
                    return true;
                }).catch((err) => {
                    return err;
                });

        }

        if (result === true) {
            resolve1(createDBObject(db));
            return;
        } else {
            reject1(result);
            return;
        }
    });
}

function createDBObject(db) {
    return {
        db: db,
        register: register,
        authenticate: authenticate,
        
        close() {
            db.close();
        }
    };
}

async function register(username, password) {
    const db = this.db;
    
    if (!db) {
        throw new Error("register() call not bound to DBObject");
    }

    // Generate hash, THEN check and add user
    return new Promise(async (resolve, reject) => {
        const hash = await bcrypt.hash(password, config().saltRounds)
            .catch((err) => {
                reject(new Err2(`Hash error for password "${password}": ${err}`, null));
            });

        if (!hash) {
            return;
        }


        db.get("SELECT username FROM users WHERE username = $user;", {$user: username}, async (err, row) => {
            if (err) {
                reject(new Err2(`Select username error for "${username}": ${err}`, null));
                return;
            }

            if (row) {
                reject(new Err2(`User "${username}" already exists`, "Username not available", false));
                return;
            }

            db.run("INSERT INTO users (username, hash) VALUES ($user, $hash);", {$user: username, $hash: hash}, (err) => {
                if (err) {
                    reject(new Err2(`Error inserting user + hash for "${username}": ${err}`, null));
                    return;
                } else {
                    resolve("Success");
                    return;
                }
            });

        });

    });
}


async function authenticate(username, password) {
    const db = this.db;

    if (!db) {
        throw new Error("authenticate() call not bound to DBObject");
    }

    // Get user's phash and salt from the table
    return new Promise((resolve, reject) => {
        db.get("SELECT username, hash FROM users WHERE username = $user;", {$user: username}, (err, row) => {
            if (err) {
                reject(new Err2(`Select username, hash error for "${username}": ${err}`, null));
                return;
            }

            if (!row) {
                reject(new Err2(`User "${username}" doesn't exist`, null, false));
                return;
            }

            if (!row.hash) {
                reject(new Err2(`User "${username}" exists but hash does not`, null));
                return;
            }

            const hash = row.hash;

            bcrypt.compare(password, hash, (err, result) => {
                if (err) {
                    reject(`Hash error for "${username}": ${err}`, null);
                    return;
                }

                if (result) {
                    resolve("Success");
                    return;
                } else {
                    reject(new Err2(`Incorrect password for "${username}"`, null, false));
                    return;
                }
            });
        });
    });
}


export default getDB;
