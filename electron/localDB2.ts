// All functions used for setting up and handling the local database for BAHIS2 syncs
// This file is used by electron/main.ts

// imports
import log from 'electron-log';
import { app } from 'electron';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';
import { unlinkSync, existsSync } from 'fs';

import { queries as queries3 } from './localDB';

// variables
const queries = `CREATE TABLE users( user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, lastlogin TEXT NOT NULL, upazila INTEGER , role Text NOT NULL, branch  TEXT NOT NULL, organization  TEXT NOT NULL, name  TEXT NOT NULL, email  TEXT NOT NULL);
CREATE TABLE app( app_id INTEGER PRIMARY KEY, app_name TEXT NOT NULL, definition TEXT NOT NULL);
CREATE TABLE forms( form_id INTEGER PRIMARY KEY, form_name TEXT NOT NULL, definition TEXT NOT NULL, choice_definition TEXT, form_uuid TEXT, table_mapping TEXT, field_names TEXT );
CREATE TABLE lists( list_id INTEGER PRIMARY KEY, list_name TEXT NOT NULL, list_header TEXT, datasource TEXT, filter_definition TEXT, column_definition TEXT);
CREATE TABLE data( data_id INTEGER PRIMARY KEY, submitted_by TEXT NOT NULL, submission_date TEXT NOT NULL, form_id INTEGER NOT NULL, data TEXT NOT NULL, status INTEGER, instanceid TEXT, last_updated TEXT);
CREATE TABLE app_log( time TEXT);
CREATE TABLE form_choices( id INTEGER PRIMARY KEY AUTOINCREMENT, value_text TEXT, xform_id TEXT , value_label TEXT, field_name TEXT, field_type TEXT);`;

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
        db.exec(queries3);
    } catch (error) {
        log.info('Failed setting up DB');
        log.info(error?.message);
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
        `INSERT INTO users (username, password, lastlogin, name, role, organization, branch, email, upazila) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
