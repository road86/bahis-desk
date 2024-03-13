// All functions used for setting up and handling the local database for BAHIS2 syncs
// This file is used by electron/main.ts

import Database from 'better-sqlite3';
import { app } from 'electron';
import { existsSync, unlinkSync } from 'fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { initialiseDBTables } from './localDB';
import { log } from './log';

// variables
const queries = `CREATE TABLE users2 ( user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, lastlogin TEXT NOT NULL, upazila INTEGER , role Text NOT NULL, branch  TEXT NOT NULL, organization  TEXT NOT NULL, name  TEXT NOT NULL, email  TEXT NOT NULL);
CREATE TABLE app2 ( app_id INTEGER PRIMARY KEY, app_name TEXT NOT NULL, definition TEXT NOT NULL);
CREATE TABLE data2 ( data_id INTEGER PRIMARY KEY, submitted_by TEXT NOT NULL, submission_date TEXT NOT NULL, form_id INTEGER NOT NULL, data TEXT NOT NULL, status INTEGER, instanceid TEXT, last_updated TEXT);
CREATE TABLE app_log2 ( time TEXT);
CREATE TABLE form_choices2 ( id INTEGER PRIMARY KEY AUTOINCREMENT, value_text TEXT, xform_id TEXT , value_label TEXT, field_name TEXT, field_type TEXT);`;

// 2023-08-21 the following options are a fix for using rollup (within vite) with better-sqlite3
const requireMe = createRequire(pathToFileURL(__filename).href);
const addon = requireMe(
    path.resolve('./node_modules/better-sqlite3/build/Release/better_sqlite3.node').replace(/(\.node)?$/, '.node'),
);

const DB_PATH = (MODE) => path.join(app.getPath('userData'), `bahis_${MODE}.db`);

export const createLocalDatabase2 = (MODE) => {
    log.info(`Creating clean local database at ${DB_PATH(MODE)}`);
    const db = new Database(DB_PATH(MODE), { nativeBinding: addon });

    log.info('Running initial queries');
    try {
        db.exec(queries);
        log.info('Initial queries ran successfully');
        initialiseDBTables(db);
        log.info('Initial tables created successfully');
    } catch (error) {
        log.error('Failed setting up DB');
        log.error(error);
    }
    log.info('Database setup finished !!!!');

    return db;
};

export const createOrReadLocalDatabase2 = (MODE) => {
    log.info(`Checking if local database exists at ${DB_PATH(MODE)}`);
    let db: any;
    if (!existsSync(DB_PATH(MODE))) {
        db = createLocalDatabase2(MODE);
    } else {
        log.info(`Using existing local database at ${DB_PATH(MODE)}`);
        db = new Database(DB_PATH(MODE), { nativeBinding: addon });
    }

    return db;
};

export const updateFreshLocalDatabase2 = async (data, userData, db) => {
    const insertStmt = db.prepare(
        `INSERT INTO users2 (username, password, lastlogin, name, role, organization, branch, email, upazila) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertStmt.run(
        data.user_name,
        userData.password,
        new Date().toISOString(),
        data.name,
        data.role,
        data.organization,
        data.branch,
        data.email,
        data.upazila,
    );

    log.info(`Created db with user details for ${data.user_name}`);
};

export const deleteLocalDatabase2 = (MODE, db) => {
    log.info(`Deleting local database at ${DB_PATH(MODE)}`);
    db.close();
    unlinkSync(DB_PATH(MODE));
};
