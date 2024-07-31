import express from 'express';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { Hash } from 'crypto';
import crypto from 'crypto';
import { assert } from 'console';
import bcrypt from 'bcrypt';
sqlite3.verbose();

const dbName = "./data.db";

const exists = fs.existsSync(dbName);

const db = new sqlite3.Database(dbName);

const saltRounds = 12;

const initQueries = [
    `CREATE TABLE users (
        username TEXT PRIMARY KEY NOT NULL,
        hash TEXT NOT NULL
    );`,
];

if (!exists) {
    const promises = [];
    
    for (const query of initQueries) {
        promises.push(new Promise((resolve, reject) => { 
            db.run(query, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve("Success");
                return;
            });
        }));
    }

    await Promise.all(promises)
        .then(() => {
            console.log("Finished DB init queries");
        }).catch((err) => {
            throw new Error(err);
        });
}

async function register(username, password) {
    // Generate hash, THEN check and add user

    return new Promise(async (resolve, reject) => {
        const hash = await bcrypt.hash(password, saltRounds)
            .catch((err) => {
                reject(err);
            });

        if (!hash) {
            return;
        }

        db.get("SELECT username FROM users WHERE username = $user;", {$user: username}, async (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row) {
                reject("User already exists");
                return;
            }

            db.run("INSERT INTO users (username, hash) VALUES ($user, $hash);", {$user: username, $hash: hash}, (err) => {
                if (err) {
                    reject(err);
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
    // Get user's phash and salt from the table
    return new Promise((resolve, reject) => {
        db.get("SELECT hash FROM users WHERE username = $user;", {$user: username}, (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                reject("User not found");
                return;
            }

            if (!row.hash) {
                reject("User's hash not found");
                return;
            }

            const hash = row.hash;

            bcrypt.compare(password, hash, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (result) {
                    resolve("Success");
                    return;
                } else {
                    reject("Password hash doesn't match");
                    return;
                }
            });
        });
    });
}


await register("asd", "123").catch((err) => {console.log(err);});

/*
await authenticate("dank", "meme")
    .then(() => {
        console.log("Authenticated as dank meme");
    })
    .catch(() => {
        console.log("Failed to authenticate as dank meme");
    });
*/



const queries = {
    register: register,
    authenticate: authenticate,
};

export default queries;
