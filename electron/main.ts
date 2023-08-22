import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import log from 'electron-log';
import path from 'node:path';
import Database from 'better-sqlite3';
import axios from 'axios';
import { random } from 'lodash';
import { existsSync, unlinkSync, writeFile } from 'fs';
import firstRun from 'electron-first-run'; // could this eventually be removed too?
import { autoUpdater } from 'electron-updater';

process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

// logging setup - keep at top of file
log.transports.file.resolvePath = () => 'electron-debug.log';
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {scope} {text}';
log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] {scope} {text}';
log.warn(`Full debug logs can be found in ${path.join(process.env.DIST, 'debug.log')}`);
autoUpdater.logger = log;

const APP_VERSION = app.getVersion();

// default environment variables, i.e. for local development
let MODE = 'development';
let BAHIS_SERVER_URL = 'http://www.bahis2-dev.net';

// set environment variables based on mode
switch (import.meta.env.MODE) {
    case 'development':
        log.transports.file.level = 'silly';
        log.transports.console.level = 'silly';
        log.transports.ipc!.level = false; // we turn this off until we can upgrade to electron-log v5 as we can't format it - all the information it would show is found in the main console and the log file anyway
        break;
    case 'staging':
        log.info('Running in staging mode');
        MODE = 'staging';
        BAHIS_SERVER_URL = 'http://www.bahis2-dev.net';
        log.transports.file.level = 'silly';
        log.transports.console.level = 'warn';
        log.transports.ipc!.level = false;
        break;
    case 'production':
        log.info('Running in production mode');
        MODE = 'production';
        BAHIS_SERVER_URL = 'http://bahis.dls.gov.bd';
        log.transports.file.level = 'info';
        log.transports.console.level = 'warn';
        log.transports.ipc!.level = false;
        break;
    default:
        break;
}

// overwrite anything defined in a .env file
if (import.meta.env.VITE_BAHIS_BAHIS_SERVER_URL) {
    BAHIS_SERVER_URL = import.meta.env.VITE_BAHIS_BAHIS_SERVER_URL;
    log.warn(`Overwriting BAHIS_SERVER_URL base on environment variables or .env[.local] file.`);
}

// report the status of environment variables and logging
log.info(`Running version ${APP_VERSION} in ${MODE} mode with the following environment variables:`);
log.info(`BAHIS_SERVER_URL=${BAHIS_SERVER_URL}`);
log.info(
    `Using the following log settings: file=${log.transports.file.level}; console=${log.transports.console.level}; ipc=${
        log.transports.ipc!.level
    }`,
);

//*** DYNAMIC VARIABLES ***//

//*** STATIC VARIABLES ***/
const DB_TABLES_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/core_admin/get/form-config/?/`;
const CATCHMENT_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/core_admin/get-api/catchment-list/`;
const APP_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/core_admin/get-api/module-list/`;
const FORMS_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/core_admin/get-api/form-list/`;
const LISTS_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/core_admin/get-api/list-def/`;
const FORM_CHOICE_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/core_admin/get-api/form-choices/`;
const SIGN_IN_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/app-user-verify/`;
const DB_NAME = 'bahis.db';
const DB_PATH = path.join(app.getPath('userData'), DB_NAME);

// 2023-08-21 the following options are a fix for using rollup (within vite) with better-sqlite3
const requireMe = createRequire(pathToFileURL(__filename).href);
const addon = requireMe(
    path.resolve('./node_modules/better-sqlite3/build/Release/better_sqlite3.node').replace(/(\.node)?$/, '.node'),
);
let db = new Database(DB_PATH, { nativeBinding: addon });

const formConfigEndpoint = (name, time) => {
    return DB_TABLES_ENDPOINT.replace('?', time).replace('core_admin', name) + `?bahis_desk_version=${APP_VERSION}`;
};

const _url = (url, name, time) => {
    if (time !== null && time !== undefined) {
        return `${url.replace('core_admin', name)}?last_modified=${time}&bahis_desk_version=${APP_VERSION}`;
    } else {
        return `${url.replace('core_admin', name)}?bahis_desk_version=${APP_VERSION}`;
    }
};

let mainWindow: BrowserWindow | null;

function createWindow() {
    log.info('created window');

    mainWindow = new BrowserWindow({
        width: 900,
        height: 680,
        icon: path.join(process.env.PUBLIC as string, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (process.env['VITE_DEV_SERVER_URL']) {
        mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL']);
    } else {
        mainWindow.loadFile(path.join(process.env.DIST as string, 'index.html'));
    }

    if (MODE === 'development') {
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.maximize();
    }

    //what does that do?
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/** adds window on app if window null */
app.whenReady().then(() => {
    const isFirstRun = firstRun();
    if (isFirstRun) {
        log.info('Will create a DB on a first run');
        prepareDb(db);
    } else {
        //we don't check for auto update on the first run, apparently that can cause problems
        autoUpdateBahis();
    }

    createWindow();
    //create a db if doesn't exist
    if (!existsSync(DB_PATH)) {
        db.close();
        log.info('Recreating DB');
        db = new Database(DB_PATH);
        prepareDb(db);
    } else {
        log.info('Using db in', DB_PATH);
    }
});

app.on('window-all-closed', () => {
    mainWindow = null;
    db.close();
    app.quit();
});

/** set up new db */
function prepareDb(db) {
    log.info('Creating New Database');
    log.info('Running initial queries');
    try {
        db.exec(queries);
    } catch (err) {
        log.info('Failed setting up DB');
        log.info(err);
    }
    log.info('Database setup finished !!!!');
}

// utils
const parseFieldNames = (parentName, possibleNames, currentFormJsn) => {
    currentFormJsn.forEach((currentElem) => {
        switch (currentElem.type) {
            case 'group':
            case 'repeat':
                possibleNames.push(parentName + currentElem.name);
                parseFieldNames(`${parentName + currentElem.name}/`, possibleNames, currentElem.children);
                break;
            case 'time':
            case 'decimal':
            case 'note':
            case 'select all that apply':
            case 'calculate':
            case 'text':
            case 'date':
            case 'select one':
            case 'integer':
                possibleNames.push(parentName + currentElem.name);
                break;
            default:
                break;
        }
    });
};

const extractPossibleFieldNames = (xformJsn) => {
    const possibleNames = [];
    parseFieldNames('', possibleNames, xformJsn.children);
    return possibleNames;
};

// listeners

/** fetches the filter dataset needed to render single select and multiple select options
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} listId - the list id of the lists table
 * @param {string[]} filterColumns - the list of columns needed in the dataset
 * @returns {Object[]} - the filter dataset containing unique combinations of columns
 */
const fetchFilterDataset = (event, listId, filterColumns) => {
    log.info(`fetchFilterDataset ${event} ${listId} ${filterColumns}`);
    try {
        const listDefinition = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId) as any;
        const datasource = JSON.parse(listDefinition.datasource);
        const datasourceQuery = datasource.type === '0' ? `select * from ${datasource.query}` : datasource.query;
        const randomTableName = `tab${Math.random().toString(36).substring(2, 12)}`;
        const a = filterColumns.toString();

        const sqliteplaceholder = ', ?'.repeat(filterColumns - 1);
        const filterDatasetQueryTxt = 'with '.concat(
            randomTableName,
            ' as (',
            datasourceQuery,
            ' ) select ?',
            sqliteplaceholder,
            ' from ',
            randomTableName,
            ' group by ?',
            sqliteplaceholder,
        );

        const filterDatasetQuery = db.prepare(filterDatasetQueryTxt);
        const returnedRows = filterDatasetQuery.all(a, a);

        event.returnValue = returnedRows;
    } catch (err) {
        log.info(`fetchFilterDataset Error ${err}`);

        event.returnValue = [];
    }
};

/** fetches the app menu definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns - the app definition json
 */
const fetchAppDefinition = async (event) => {
    log.info(`fetchAppDefinition ${event}`);
    try {
        const appResult = db.prepare('SELECT definition from app where app_id=1').get() as any;
        const appResultDefinition = appResult.definition;
        if (appResultDefinition) {
            log.info('fetchAppDefinition SUCCESS');
            return appResultDefinition;
        } else {
            log.info('fetchAppDefinition FAILED - undefined');
            return null;
        }
    } catch (err) {
        log.info(`fetchAppDefinition FAILED ${err}`);
        return null;
    }
};

const submitFormResponse = (event, response) => {
    log.info('submitFormResponse');
    //The following deletes a record when editing an existing entry and replacing it with a new one
    deleteDataWithInstanceId(db, JSON.parse(response.data)['meta/instanceID'], response.formId);
    const fetchedUsername = getCurrentUser();
    event.returnValue = {
        username: fetchedUsername,
    };
    const date = new Date().toISOString();
    const insert = db.prepare(
        'INSERT INTO data (form_id, data, status,  submitted_by, submission_date, instanceid) VALUES (?, ?, 0, ?, ?, ?)',
    );
    insert.run(response.formId, response.data, fetchedUsername, date, JSON.parse(response.data)['meta/instanceID']);
    parseAndSaveToFlatTables(db, response.formId, response.data, null);
    log.info('submitFormResponse COMPLETE');
};

/** fetches the form definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} formId- the form id
 * @returns - the definition of form respective to form id
 */
const fetchFormDefinition = (event, formId) => {
    log.info(`fetchFormDefinition ${event} ${formId}`);
    try {
        const formDefinitionObj = db.prepare('SELECT * from forms where form_id = ? limit 1').get(formId) as any;
        if (formDefinitionObj != undefined) {
            const choiceDefinition = formDefinitionObj.choice_definition
                ? JSON.parse(formDefinitionObj.choice_definition)
                : {};
            const choices = {};
            Object.keys(choiceDefinition).forEach((key) => {
                try {
                    const { query } = choiceDefinition[key];
                    choices[`${key}.csv`] = db.prepare(query).all();
                } catch (err) {
                    log.info(`Choice Definition Error  ${err}`);
                }
            });

            log.info(`Choices for form ${formId}:  ${choices}`);
            event.returnValue = { ...formDefinitionObj, formChoices: JSON.stringify(choices) };
        } else {
            event.returnValue = null;
            log.info(`fetchFormDefinition problem, no such form with ${formId}`);
            log.info('see `SELECT * from forms where form_id = ? limit 1`');
        }
    } catch (err) {
        log.info(`fetchFormDefinition Error  ${err}`);
    }
};

const fetchFormChoices = (event, formId) => {
    try {
        log.info(`fetchFormChoices  ${formId}`);
        const formchoices = db.prepare(`SELECT * from form_choices where xform_id = ? `).all(formId);
        event.returnValue = formchoices;
    } catch (err) {
        log.info('error fetch form choices ', err);
    }
};

const fetchFormDetails = (event, listId, column = 'data_id') => {
    log.info(`fetchFormDetails  ${event} ${listId}`);
    try {
        const formData = db.prepare(`SELECT * from data where ${column} = ? limit 1`).get(listId);
        log.info(formData);
        if (formData != undefined) {
            event.returnValue = { formDetails: formData };
        } else {
            event.returnValue = null;
        }
    } catch (err) {
        log.info(err);
        log.info(`Fetch FormDetails  ${err}`);
    }
};

/** fetches the list definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} listId- the list id
 * @returns - the definition of list respective to list id
 */
const fetchListDefinition = (event, listId) => {
    log.info(`fetchListDefinition, listId: ${listId}`);
    try {
        const fetchedRows = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId) as any;

        if (fetchedRows) {
            event.returnValue = {
                filterDefinition: fetchedRows.filter_definition,
                columnDefinition: fetchedRows.column_definition,
                datasource: fetchedRows.datasource,
                listName: fetchedRows.list_name,
                listHeader: fetchedRows.list_header,
            };
        } else {
            event.returnValue = null;
        }
    } catch (err) {
        log.info(`fethcListDefinition Error, listId: ${listId}`);
    }
};

function getCurrentUser() {
    const query = 'SELECT username from users LIMIT 1';
    const fetchedRow = db.prepare(query).get() as any;
    return fetchedRow.username;
}

const fetchFormListDefinition = (event, formId) => {
    log.info(`fetchFormListDefinition, listId: ${formId}`);
    try {
        const userName = getCurrentUser();
        const query = 'SELECT * from data where form_id = ? and submitted_by = ?';
        const fetchedRows = db.prepare(query).all(formId, userName);

        event.returnValue = { fetchedRows };
    } catch (err) {
        log.info(`fetchFormListDefinition, listId: ${formId}`);
    }
};

const fetchFollowupFormData = (event, formId, detailsPk, pkValue, constraint) => {
    log.info(`fetchFollowupFormData, formId: ${formId} ${detailsPk}, ${pkValue}, ${constraint}`);
    try {
        let query;
        if (constraint == 'equal') {
            query =
                "SELECT data_id, submitted_by, submission_date, data from data where form_id = ? and json_extract(data, '$.?') = ?";
        } else {
            query =
                "SELECT data_id, submitted_by, submission_date, data from data where form_id = ? and json_extract(data, '$.?') LIKE '%?%'";
        }
        const fetchedRows = db.prepare(query).all(formId, detailsPk, pkValue);

        event.returnValue = { fetchedRows };
    } catch (err) {
        log.info(`fetchFollowupFormData, formId: ${formId}`);
    }
};

/** fetches the data based on query
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} queryString- the query string
 * @returns - the returned dataset from the query
 */
const fetchQueryData = (event, queryString) => {
    log.info(`fetchQueryData, formId: ${queryString}`);
    try {
        const fetchedRows = db.prepare(queryString).all();

        event.returnValue = fetchedRows;
        log.info('fetchQueryData SUCCESS');
    } catch (err) {
        log.info('fetchQueryData FAILED');
        log.info(err);
        event.returnValue = []; //lack of return here was hanging the frontend which incorectly used sendSync
    }
};

const configureFreshDatabase = async (data, userData) => {
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

    log.info(`Created db with user details, now synchronising form config and catchments for ${data.user_name}`);
    await synchroniseFormConfig(data.user_name, 0).then(() => {
        synchroniseCatchments(data.user_name, 0);
    });
};

const changeUser = async (event, obj) => {
    db.close();
    unlinkSync(DB_PATH);
    log.info('new db setup call after delete previous user data');
    db = new Database(DB_PATH);
    prepareDb(db);
    const { response, userData } = obj;
    configureFreshDatabase(response, userData);
    const results = { username: response.user_name, message: 'changeUser' };
    mainWindow?.webContents.send('formSubmissionResults', results);
    event.returnValue = {
        userInfo: response,
    };
};

const synchroniseFormConfig = async (name, time) => {
    log.info(`Synchronising FormConfig (time: ${time})`);
    log.info(`api url: ${formConfigEndpoint(name, time)}`);

    await axios.get(`${formConfigEndpoint(name, time)}`).then((formConfigRes) => {
        // we never log the time this was run, as we currently only run it on DB creation
        // We will need to log this when we make it possible for users to resync this?
        // Or will we? Maybe we always use time === 0
        // See also synchroniseCatchments
        // const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
        // newLayoutQuery.run(new Date().getTime());

        if (formConfigRes.data) {
            log.info('formConfigRes data');
            formConfigRes.data.forEach((sqlObj) => {
                if (sqlObj.sql_script) {
                    try {
                        db.exec(sqlObj.sql_script);
                    } catch (err: any) {
                        log.info('formConfigRes FAILED');
                        log.info('Error: ', err.message);
                    }
                }
            });
            log.info('formConfigRes SUCCESS');
        }
    });
};

const synchroniseCatchments = async (name, time) => {
    log.info(`Synchronising Catchments (time: ${time})`);
    log.info(`api url: ${_url(CATCHMENT_DEFINITION_ENDPOINT, name, time)}`);
    await axios
        .get(_url(CATCHMENT_DEFINITION_ENDPOINT, name, time))
        .then((catchmentListRes) => {
            // we never log the time this was run, as we currently only run it on DB creation
            // We will need to log this when we make it possible for users to resync this?
            // Or will we? Maybe we always use time === 0
            // See also synchroniseFormConfing
            //  const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
            //  newLayoutQuery.run(new Date().getTime());

            if (catchmentListRes.data) {
                log.info('catchmentListRes data');
                populateCatchment(catchmentListRes.data);
            }

            log.info('Synchronising Catchments SUCCESS');
        })
        .catch((error) => {
            log.info('Synchronising Catchments FAIL \n', error.message);
        });
};

const synchroniseModules = async (name, time) => {
    log.info(`Synchronising Modules (time: ${time})`);
    log.info(`api url: ${_url(APP_DEFINITION_ENDPOINT, name, time)}`);
    axios
        .get(_url(APP_DEFINITION_ENDPOINT, name, time))
        .then((moduleListRes) => {
            const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
            newLayoutQuery.run(Date.now());

            if (moduleListRes.data) {
                log.info('moduleListRes data');
                const layoutDeleteQuery = db.prepare('DELETE FROM app');

                try {
                    log.info('clearing app layout');
                    layoutDeleteQuery.run();
                } catch (error) {
                    log.info('Previous Layout does not exist');
                    log.info(error);
                }
                log.info('clearing module_image');
                db.prepare('DELETE FROM module_image').run();
                updateAppDefinition(moduleListRes.data);
                // Tell the front end the sync is done
                mainWindow?.webContents.send('formSyncComplete', 'done'); //done is a keyword checked later
            }
            log.info('Synchronising Modules SUCCESS');
        })
        .catch((error) => {
            log.info('Synchronising Modules FAIL \n', error);
        });
};

//  NOTE
/**
 * there are four scenario in sign in process
 * 1. when a user login for the first time we save its details in db. and sync for its  modules, forms, lists
 * 2. when a user try to login, we check db for its login history. if we found any, we will forward that user to home page
 * 3. if a user try to login, we will check the db for its login history and if we found a different user then
 *    we will show a delete-data dialog to remove everything related to the previous user
 */
const signIn = async (event, userData) => {
    log.info('electron-side signIn');
    const query = 'SELECT * from users limit 1';
    let userInfo = db.prepare(query).get() as any;
    // if a user has signed in before then no need to call signin-api
    // allowing log in offline. This feautre is currently mostly useless since you cannot use the app until initial synchronisation finishes
    if (userInfo && userInfo.username == userData.username && userInfo.password == userData.password && userInfo.upazila) {
        log.info('This is an offline-ready account.');
        const results = { username: userData.username, message: 'signIn::local' };
        mainWindow?.webContents.send('formSubmissionResults', results);
        event.returnValue = {
            userInfo: '',
            message: '',
        };
    } else {
        if (userInfo && userInfo.username == userData.username && userInfo.password == userData.password) {
            // from v2.2 user's need an upazila in the local DB
            // if a user exists but doesn't have an upazila, add it now
            // annoyingling sqlite doesn't let you alter column types
            // so we drop and re-create and then treat as a first time sign in to fill
            log.info('Update users table to include numerical upazilla before normal sign in');
            const drop_table = 'DROP TABLE users;';
            const create_table =
                'CREATE TABLE users( user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, lastlogin TEXT NOT NULL, upazila INTEGER , role Text NOT NULL, branch  TEXT NOT NULL, organization  TEXT NOT NULL, name  TEXT NOT NULL, email  TEXT NOT NULL);';
            db.exec(drop_table);
            db.exec(create_table);
            userInfo = undefined;
        }

        const data = {
            username: userData.username,
            password: userData.password,
            upazila: 202249,
            bahis_desk_version: APP_VERSION,
        };
        log.info('Attempt To Signin');
        log.info(`signin url: ${SIGN_IN_ENDPOINT}`);

        let results = {};

        await axios
            .post(SIGN_IN_ENDPOINT, JSON.stringify(data), {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => {
                if (!(Object.keys(response.data).length === 0 && response.data.constructor === Object)) {
                    // if (response.status == 200 || response.status == 201) {
                    log.info('Signed In received a response! :)');

                    // if a user has signed in for the first time
                    if (userInfo === undefined) {
                        log.info('New user - setting up local db');
                        configureFreshDatabase(response.data, userData);
                        log.info('Local db configured');
                        results = { username: response.data.user_name, message: 'signIn::firstTimeUser' };
                        mainWindow?.webContents.send('formSubmissionResults', results);
                        event.returnValue = {
                            userInfo: response.data,
                            // message: ""
                        };
                    }
                    //the user has changed
                    else if (userInfo && userInfo.username !== response.data.user_name) {
                        log.info('Change of user - handing back to human');
                        results = {
                            response: response.data,
                            userData,
                        };
                        mainWindow?.webContents.send('deleteTableDialogue', results);
                    }
                    //if it is the same user
                    else {
                        log.info('Existing user');
                        // given the offline-ready stuff we do above... do we use this branch?
                        results = { username: response.data.user_name, message: 'signIn::offlineUser' };
                        mainWindow?.webContents.send('formSubmissionResults', results);
                        event.returnValue = {
                            userInfo: response.data,
                            // message: ""
                        };
                    }
                } else {
                    results = {
                        message: 'Cannot log in, did you provide correct username and password?',
                        username: '',
                    };
                    mainWindow?.webContents.send('formSubmissionResults', results);
                }
            })
            .catch((error) => {
                results = {
                    message: getErrorMessage(error),
                    username: '',
                };
                mainWindow?.webContents.send('formSubmissionResults', results);
                log.info('Sign In Error');
                log.info(error);
            });
    }
};

const getErrorMessage = (error) => {
    log.info(error.message);
    if (error.message.includes('403')) {
        return 'Only upazilas can use BAHIS-desk, please contact support.';
    }
    if (error.message.includes('409')) {
        return 'Users credentials are not authorized or missing catchment area.';
    }
    return 'Unauthenticated User.';
};

const populateCatchment = (catchments) => {
    log.info(`populateCatchment: ${catchments.length}`);
    db.prepare('DELETE FROM geo_cluster').run();
    const geoData = catchments ? catchments : [];
    if (geoData.length) {
        const insertStmt = db.prepare(
            `INSERT INTO geo_cluster (value, name, loc_type , parent) VALUES (@value, @name, @loc_type, @parent)`,
        );

        const insertMany = db.transaction((geos) => {
            for (const geo of geos)
                insertStmt.run({
                    value: geo.value.toString(),
                    name: geo.name,
                    loc_type: geo.loc_type.toString(),
                    parent: geo.parent.toString(),
                });
        });

        insertMany(geoData);
    }
};

const updateAppDefinition = (appDefinition) => {
    log.info('updateAppDefinition');
    log.info(JSON.stringify(appDefinition.name));
    const update = function (module) {
        if (module.xform_id != '') {
            const formModule = {
                xform_id: module.xform_id,
                name: module.name,
                img_id: module.img_id,
                children: [],
                label: {
                    Bangla: 'New Submission',
                    English: 'New Submission',
                },
                catchment_area: module.catchment_area,
                list_id: '',
                type: 'form',
                id: module.id,
            };
            const listId = random(100, 200);
            const listModule = {
                xform_id: module.xform_id,
                name: 'module_' + listId,
                img_id: '',
                children: [],
                label: {
                    Bangla: 'Submitted Data',
                    English: 'Submitted Data',
                },
                catchment_area: module.catchment_area,
                list_id: '',
                type: 'form_list',
                id: listId,
            };
            module.xform_id = '';
            module.name = 'module_' + listId;
            module.img_id = '';
            //  module.childre = {
            //    formModule,
            //    listModule
            //  }
            module.children.push(formModule);
            module.children.push(listModule);
            module.type = 'container';
            module.id = listId;
        } else if (module.children)
            module.children.forEach((mod) => {
                update(mod);
            });
    };

    appDefinition.children.forEach((definition) => {
        update(definition);
    });

    try {
        const newLayoutQuery = db.prepare('INSERT INTO app(app_id, app_name, definition) VALUES(1, ?,?)');
        newLayoutQuery.run('Bahis_Updated', JSON.stringify(appDefinition));
    } catch (err) {
        log.info(err);
        //
    }
    log.info('updateAppDefinition FINISHED');
};

const exportExcel = (event, excelData) => {
    log.debug(`exporting Excel due to ${event}`);
    let filename: string | undefined;
    dialog
        .showSaveDialog({
            filters: [
                {
                    name: 'Bahis',
                    extensions: ['xls'],
                },
            ],
        })
        .then((result) => {
            filename = result.filePath;
            if (filename === undefined) {
                log.info(filename);
                dialog.showMessageBox({
                    title: 'Download Updates',
                    message: "couldn't create a file.",
                });
                return;
            }

            writeFile(filename, new Buffer(excelData), (err) => {
                if (err) {
                    log.info(`an error occured with file creation,  ${err}`);
                    dialog.showMessageBox({
                        title: 'Download Updates',
                        message: `an error ocurred with file creation ${err.message}`,
                    });
                    return;
                }
                dialog.showMessageBox({
                    title: 'Download Updates',
                    message: 'File Downloaded Successfully',
                });
            });
        })
        .catch((err) => {
            dialog.showMessageBox({
                title: 'Download Updates',
                message: `${err}`,
            });
            log.info(`export excel error: ${err}`);
        });
};

const fetchUsername = (event, infowhere) => {
    log.info(`fetchUsername: ${infowhere}`);
    try {
        const fetchedUsername = db.prepare('SELECT username from users order by lastlogin desc limit 1').get() as any;

        log.info('XIM2, we fetched', JSON.stringify(fetchedUsername));
        event.returnValue = {
            username: fetchedUsername.username,
        };
        log.info('fetchUsername SUCCESS');
    } catch (err) {
        log.info(`fetchUsername FAILED ${err}`);
        //
    }
};

const fetchImage = (event, moduleId) => {
    log.info(`fetchImage: ${moduleId}`);
    try {
        const query = 'SELECT directory_name FROM module_image where module_id=?';
        const fetchedRows = db.prepare(query).get(moduleId) as any;
        event.returnValue = fetchedRows != null ? fetchedRows.directory_name : '';
        log.info('fetchImage SUCCESS');
    } catch (err) {
        log.info(`fetchImage FAILED ${err}`);
    }
};

const fetchUserList = (event) => {
    try {
        const fetchedRows = db.prepare('SELECT DISTINCT	username, name FROM users').all();

        log.info(fetchedRows);
        event.returnValue = {
            users: fetchedRows,
        };
    } catch (err) {
        log.info(err);
    }
};

const fetchGeo = (event, level, divisionId, districtId) => {
    log.info('Fetchin geodata');
    if (level === 'division') {
        const fetchedRows = db.prepare('SELECT DISTINCT	div_id, division FROM geo').all();
        event.returnValue = {
            division: fetchedRows,
        };
    } else if (level === 'district') {
        const query = 'SELECT DISTINCT dis_id, district FROM geo WHERE div_id = ?';
        const fetchedRows = db.prepare(query).all(divisionId);
        event.returnValue = {
            district: fetchedRows,
        };
    } else {
        //upazila
        const query = 'SELECT DISTINCT upz_id, upazila FROM geo WHERE div_id = ? AND dis_id = ?';
        const fetchedRows = db.prepare(query).all(divisionId, districtId);
        event.returnValue = {
            upazila: fetchedRows,
        };
    }
};

const startAppSync = (event, name, time) => {
    log.info('App Sync Started');
    log.debug(`due to ${event}`);
    log.info('Below API will be called');

    let last_sync_time = 0;
    if (time === undefined) {
        const log = db.prepare('SELECT * from app_log order by time desc limit 1').get() as any;
        last_sync_time = log === undefined ? 0 : Math.round(log.time);
    }

    log.info(`${_url(FORMS_ENDPOINT, name, last_sync_time)}`);
    log.info(`${_url(LISTS_ENDPOINT, name, last_sync_time)}`);
    log.info(`${_url(FORM_CHOICE_ENDPOINT, name, last_sync_time)}`);

    axios
        .all([
            axios.get(_url(FORMS_ENDPOINT, name, last_sync_time)),
            axios.get(_url(LISTS_ENDPOINT, name, last_sync_time)),
            axios.get(_url(FORM_CHOICE_ENDPOINT, name, last_sync_time)),
        ])
        .then(
            axios.spread((formListRes, listRes, formChoice) => {
                const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
                newLayoutQuery.run(Date.now());
                if (formListRes.data) {
                    log.info(` FormListRes data (time: ${last_sync_time}; total: ${formListRes.data.length}) `);
                    const previousFormDeletionQuery = db.prepare('DELETE FROM forms WHERE form_id = ?');
                    const newFormInsertionQuery = db.prepare(
                        'INSERT INTO forms(form_id, form_name, definition, choice_definition, form_uuid, table_mapping, field_names) VALUES(?,?,?,?,?,?,?)',
                    );
                    formListRes.data.forEach(async (formObj) => {
                        try {
                            previousFormDeletionQuery.run(formObj.id);
                        } catch (err) {
                            log.info('Deletion Failed ! Previous form not exists!!');
                        }
                        try {
                            const fieldNames = extractPossibleFieldNames(formObj.form_definition);
                            newFormInsertionQuery.run(
                                formObj.id,
                                formObj.name,
                                JSON.stringify(formObj.form_definition),
                                JSON.stringify(formObj.choice_list),
                                formObj.form_uuid,
                                JSON.stringify(formObj.table_mapping),
                                JSON.stringify(fieldNames),
                            );
                        } catch (err) {
                            log.info('db form insertion failed !!!', err);
                        }
                    });
                    if (listRes.data) {
                        log.info(` ListRes data (time: ${last_sync_time}; total: ${listRes.data.length}) `);
                        const previousListDeletionQuery = db.prepare('DELETE FROM lists WHERE list_id = ?');
                        const newListInsertQuery = db.prepare(
                            'INSERT INTO lists(list_id, list_name, list_header, datasource, filter_definition, column_definition) VALUES(?,?,?,?,?,?)',
                        );
                        listRes.data.forEach((listObj) => {
                            try {
                                previousListDeletionQuery.run(listObj.id);
                            } catch (err) {
                                log.info('Deletion Failed ! Previous list not exists!!');
                            }
                            try {
                                newListInsertQuery.run(
                                    listObj.id,
                                    listObj.list_name,
                                    JSON.stringify(listObj.list_header),
                                    JSON.stringify(listObj.datasource),
                                    JSON.stringify(listObj.filter_definition),
                                    JSON.stringify(listObj.column_definition),
                                );
                            } catch (err) {
                                log.info('db list insertion failed', err);
                            }
                        });
                    }
                    if (formChoice.data) {
                        log.info(`  formChoice data (time: ${last_sync_time}; total: ${formChoice.data.length}) `);
                        const previousFormChoices = db.prepare(
                            'DELETE FROM form_choices WHERE value_text = ? and field_name = ? and xform_id = ? ',
                        );

                        const insertQuery = db.prepare(
                            'INSERT INTO form_choices( value_text, xform_id, value_label, field_name, field_type) VALUES(?,?,?,?,?)',
                        );

                        log.info('total form choice data');
                        log.info(formChoice.data.length);

                        formChoice.data.forEach(async (formObj) => {
                            try {
                                previousFormChoices.run(formObj.value_text, formObj.field_name, formObj.xform_id);
                            } catch (err) {
                                log.info('db form_choice deletion failed');
                            }

                            try {
                                insertQuery.run(
                                    formObj.value_text,
                                    String(formObj.xform_id),
                                    formObj.value_label,
                                    formObj.field_name,
                                    formObj.field_type,
                                );
                            } catch (err) {
                                log.info('db form_choice insertion failed');
                            }
                        });
                    }
                }
            }),
        )
        .then(() => {
            // We synchronise modules after because of time outs
            synchroniseModules(name, last_sync_time);
        })
        .catch((err) => {
            log.info('App Sync Failed At Login  \n', err);
        });
};

const requestDataSync = async (event, username) => {
    log.info('requestDataSync  +');
    let msg: any;
    await sendDataToServer(db, username, mainWindow)
        .then(async (r) => {
            msg = r;
            await fetchDataFromServer(db, username);
        })
        .then(async () => {
            await csvDataSync(db, username);
            log.info('wait for csv data sync');
        })
        .then(() => {
            log.info('requestDataSync SUCCESS  +');
            event.returnValue = msg;

            // close the synchronizing popup message
            log.info('Data Sync Complete');
            mainWindow?.webContents.send('dataSyncComplete', 'synchronised');
        });
};

const csvDataSync = async (db, username) => {
    log.info('XIM1 csvDataSync');
    try {
        const tableExistStmt = 'SELECT name FROM sqlite_master WHERE type=? AND name=?';
        const csvInfo = db.prepare(tableExistStmt).get('table', 'csv_sync_log');
        if (csvInfo && csvInfo.name == 'csv_sync_log') {
            await fetchCsvDataFromServer(db, username);
        } else {
            log.info('I think that csv_sync_log table does not exist so I will create it');
            db.prepare('CREATE TABLE csv_sync_log( time TEXT)').run();
            await fetchCsvDataFromServer(db, username);
        }
        log.info('csvDataSync  SUCCESS');
        return 'success';
    } catch (err) {
        log.info('csvDataSync FAILED');
        log.info(err);
        return 'failed';
    }
};

const getUserDBInfo = (event) => {
    // FIXME this function is actually about user location and is badly named
    try {
        const query_to_get_upazila = `select upazila from users`;
        const upazila_id = (db.prepare(query_to_get_upazila).get() as any).upazila;
        const query_to_get_district = `select parent from geo_cluster where value in (${upazila_id})`;
        const district_id = (db.prepare(query_to_get_district).get() as any).parent;
        const query_to_get_division = `select parent from geo_cluster where value in (${district_id})`;
        const division_id = (db.prepare(query_to_get_division).get() as any).parent;
        const geoInfo = { division: division_id, district: district_id, upazila: upazila_id.toString() };

        if (geoInfo !== undefined) {
            log.info(`userDB SUCCESS ${JSON.stringify(geoInfo)}`);
            event.returnValue = geoInfo;
        } else {
            log.info('userDB FAILED - undefined');
        }
    } catch (err) {
        log.info(`userDBInfo FAILED ${err}`);
    }
};

const deleteData = (event, instanceId, formId) => {
    log.info(instanceId, formId);
    deleteDataWithInstanceId(db, instanceId, formId);
    event.returnValue = {
        status: 'successful',
    };
};

const autoUpdateBahis = () => {
    log.info('Checking for the app software updates call');
    if (MODE !== 'development') {
        autoUpdater.checkForUpdatesAndNotify();
    } else {
        log.info('Not checking for updates in dev mode');
    }
};

const SUBMISSION_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/core_admin/submission/`;
const CSV_DATA_FETCH_ENDPOINT = `${BAHIS_SERVER_URL}/bhmodule/system-data-sync/core_admin/`;
const DATA_SYNC_COUNT = `${BAHIS_SERVER_URL}/bhmodule/form/core_admin/data-sync-count/`;
const DATA_SYNC_PAGINATED = `${BAHIS_SERVER_URL}/bhmodule/form/core_admin/data-sync-paginated/`;
const PAGE_LENGTH = 100;

const queries = `CREATE TABLE users( user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, lastlogin TEXT NOT NULL, upazila INTEGER , role Text NOT NULL, branch  TEXT NOT NULL, organization  TEXT NOT NULL, name  TEXT NOT NULL, email  TEXT NOT NULL);
CREATE TABLE app( app_id INTEGER PRIMARY KEY, app_name TEXT NOT NULL, definition TEXT NOT NULL);
CREATE TABLE forms( form_id INTEGER PRIMARY KEY, form_name TEXT NOT NULL, definition TEXT NOT NULL, choice_definition TEXT, form_uuid TEXT, table_mapping TEXT, field_names TEXT );
CREATE TABLE lists( list_id INTEGER PRIMARY KEY, list_name TEXT NOT NULL, list_header TEXT, datasource TEXT, filter_definition TEXT, column_definition TEXT);
CREATE TABLE data( data_id INTEGER PRIMARY KEY, submitted_by TEXT NOT NULL, submission_date TEXT NOT NULL, form_id INTEGER NOT NULL, data TEXT NOT NULL, status INTEGER, instanceid TEXT, last_updated TEXT);
CREATE TABLE app_log( time TEXT);
CREATE TABLE module_image( id INTEGER PRIMARY KEY AUTOINCREMENT, module_id TEXT NOT NULL, image_name TEXT NOT NULL, directory_name TEXT );
CREATE TABLE form_choices( id INTEGER PRIMARY KEY AUTOINCREMENT, value_text TEXT, xform_id TEXT , value_label TEXT, field_name TEXT, field_type TEXT);
CREATE TABLE geo( geo_id INTEGER PRIMARY KEY AUTOINCREMENT, div_id TEXT NOT NULL, division TEXT NOT NULL, dis_id TEXT NOT NULL, district TEXT NOT NULL, upz_id TEXT NOT NULL, upazila TEXT NOT NULL);`;

/** fetches data from server to app
 * @returns {string} - success if successful; otherwise, failed
 */
const fetchCsvDataFromServer = async (db, username) => {
    log.info('fetchCsvData call', username);
    try {
        const last_updated = db.prepare('SELECT time from csv_sync_log order by time desc limit 1').get() as any;
        const updated = last_updated == undefined || last_updated.time == null ? 0 : last_updated.time;
        const url = _url(CSV_DATA_FETCH_ENDPOINT, username, updated);
        log.info(url);
        await axios
            .get(url)
            .then((response) => {
                const newDataRows = response.data;
                newDataRows.forEach((newDataRow) => {
                    if (newDataRow.data) {
                        deleteCSVDataWithPk(db, newDataRow.primary_key, newDataRow, newDataRow.table_name);
                        saveNewCSVDataToTable(db, newDataRow);
                    }
                });
                const newLayoutQuery = db.prepare('INSERT INTO csv_sync_log(time) VALUES(?)');
                newLayoutQuery.run(Date.now());
            })
            .catch((error) => {
                log.info('axios error', error);
                return 'failed';
            });
        return 'success';
    } catch (err) {
        log.info('fetch err', err);
        return 'failed';
    }
};

/** deletes the entry from data table and related tables if exist
 * @param {string} pkList
 * @param {string} rowData
 */
const deleteCSVDataWithPk = (db, pkList, rowData, tableName) => {
    log.debug(tableName); // TODO: remove
    try {
        rowData.data.forEach((rowObj) => {
            let sqlWhereClause = `delete from ${rowData.table_name} where `;
            pkList.forEach((filterName) => {
                if (rowObj[filterName] !== '') {
                    sqlWhereClause = `${sqlWhereClause} ${filterName} = ${rowObj[filterName]} and `;
                }
            });
            const dataDeleteStmt = sqlWhereClause !== '' ? sqlWhereClause.slice(0, -4) : '';
            log.info(dataDeleteStmt);
            db.prepare(dataDeleteStmt).run();
        });
    } catch (err) {
        log.info(err);
    }
};

/** saves new cvs data to table
 * @param {object} rowData - the userinput object containing field values that need to be saved
 */
const saveNewCSVDataToTable = (db, rowData) => {
    try {
        let keys = '';
        let values = '';
        Object.keys(rowData.data[0]).forEach((filterName) => {
            if (rowData.data[filterName] !== '') {
                keys = `${keys}${filterName}, `;
                values = `${values}@${filterName}, `;
            }
        });
        const sqlWhereClause = `INSERT INTO ${rowData.table_name} (${keys.slice(0, -2)}) VALUES (${values.slice(0, -2)})`;
        const insertMany = db.transaction((rows) => {
            for (const row of rows) db.prepare(sqlWhereClause).run(row);
        });

        insertMany(rowData.data);
    } catch (err) {
        log.info(err);
    }
};

/** fetches data from server to app
 * @returns {string} - success if successful; otherwise, failed
 */
const fetchDataFromServer = async (db, username) => {
    log.info('XIM1 fetch call of the user', username);
    log.info('See database here', app.getPath('userData'));

    try {
        const last_updated = db.prepare('SELECT last_updated from data order by last_updated desc limit 1').get() as any;
        const updated =
            last_updated == undefined || last_updated.last_updated == null ? 0 : new Date(last_updated.last_updated).valueOf();
        const url = _url(DATA_SYNC_PAGINATED, username, updated);
        const dataCountUrl = _url(DATA_SYNC_COUNT, username, updated);

        log.info(`Data count URL ${dataCountUrl}`);
        const dataSyncCountResponse = await axios.get(`${dataCountUrl}`);

        log.info('Data Sync Started');
        const dataLength = Array.isArray(dataSyncCountResponse.data)
            ? dataSyncCountResponse.data[0].count
            : dataSyncCountResponse.data.count;

        const maxRetries = 5;
        let tries = 1;
        const pageUrls: string[] = [];
        const serverCalls: number[] = [];

        //get list of axios promise from urls
        const getPromiseAll = (urls) => {
            const promises: Promise<any>[] = [];
            urls.forEach((pageUrl, i) => {
                promises.push(
                    axios
                        .get(pageUrl)
                        .then((response) => {
                            serverCalls.push(i + 1);

                            log.info(`call ${i + 1}: ${pageUrl}`);
                            const newDataRows = response.data;
                            newDataRows.forEach((newDataRow) => {
                                saveNewDataToTable(db, newDataRow.id.toString(), newDataRow.xform_id, newDataRow.json);
                            });

                            log.info('data saved into database');

                            return true;
                        })
                        .catch(() => {
                            log.info('Error in Data sync');
                            log.info(`Error Occurred In the response of this url: ${pageUrl}`);
                            return pageUrl;
                        }),
                );
            });

            return promises;
        };

        // calling all the promise and check failed request and retrying for failed request
        const callPromiseAll = async (promises) => {
            await Promise.all(promises).then((data) => {
                log.info(data);
                const failedReq = data.filter((val) => {
                    return val !== true && typeof val == 'string';
                });

                log.info('Failed request: ', failedReq);

                if (failedReq.length > 0 && tries <= maxRetries) {
                    // giving 1 sec delay for each tries
                    setTimeout(async () => {
                        log.info(`tries ${tries}`);
                        await callPromiseAll(getPromiseAll(failedReq));
                    }, 1000);
                    tries++;
                }
            });
        };

        // generate the page url from data length
        for (let i = 1; i <= dataLength / PAGE_LENGTH + 1; i++) {
            const pageUrl = `${url}&last_modified=${updated}&page_no=${i}&page_length=${PAGE_LENGTH}`;
            pageUrls.push(pageUrl);
        }

        const promises = getPromiseAll(pageUrls);

        await callPromiseAll(promises);

        log.info(serverCalls);
        log.info(`total server call: ${serverCalls.length}`);
        log.info('Data Sync Complete');

        return 'success';
    } catch (err) {
        log.info('fetch err', err);
        log.info('Error In Fetching Data From Server');
        log.info(err);
        return 'failed';
    }
};

const deleteDataWithInstanceId = (db, instanceId, formId) => {
    log.info(`deleteDataWithInstanceID; instanceId: ${instanceId.toString()}; formId: ${formId}`);
    try {
        let sql = 'DELETE FROM data WHERE instanceid = ?';
        let stmt = db.prepare(sql);
        let numDeleted = stmt.run(instanceId.toString()).changes;
        log.info(`Row(s) deleted from table "data": ${numDeleted}`);
        if (numDeleted > 0) {
            const formDefinitionObj = db.prepare('SELECT * FROM forms WHERE form_id = ?').get(formId);
            const tableMapping = JSON.parse(formDefinitionObj.table_mapping);
            tableMapping.forEach((tableName) => {
                try {
                    sql = `DELETE FROM ${tableName} WHERE instanceid = ?`;
                    stmt = db.prepare(sql);
                    numDeleted = stmt.run(instanceId.toString()).changes;
                    log.info(`Row(s) deleted from table "${tableName}": ${numDeleted}`);
                    log.info('deleteDataWithInstanceID SUCCESS');
                } catch (err) {
                    log.info('deleteDataWithInstanceID FAILED');
                    console.error(err);
                }
            });
        }
    } catch (err) {
        log.info('deleteDataWithInstanceID FAILED');
        log.info(err);
    }
};

/** saves new data to table
 * @param {string} instanceId - the unique instance id
 * @param {string} formId - the unique form id
 * @param {object} userInput - the userinput object containing field values that need to be saved
 */
const saveNewDataToTable = (db, instanceId, formId, userInput) => {
    try {
        const date = userInput._submission_time
            ? new Date(userInput._submission_time).toISOString()
            : new Date().toISOString();

        const insertStmt = db.prepare(
            `INSERT INTO data (form_id, data, status, instanceid, last_updated, submitted_by, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        );
        insertStmt.run(
            formId,
            JSON.stringify(userInput),
            1,
            instanceId,
            new Date().toISOString(),
            userInput._submitted_by,
            date,
        );

        parseAndSaveToFlatTables(db, formId, JSON.stringify(userInput), instanceId);
    } catch (err) {
        log.info('Save New Data To Table');
    }
};

/** parses and saves the user response to flat tables
 * @param {any} dbConnection - the better sqlite 3 db connection
 * @param {Number} formId - the formId of the form that is filled out
 * @param {Object} userInput - the user response object following odk format
 * @param {string} instanceId - the instance id that will be saved
 */
const parseAndSaveToFlatTables = (dbConnection, formId, userInput, instanceId) => {
    const formObj = dbConnection.prepare('SELECT * from forms where form_id = ? limit 1').get(formId);
    if (formObj !== undefined) {
        const formDefinition = JSON.parse(formObj.definition);
        const formFieldNames = JSON.parse(formObj.field_names);
        const userInputObj = JSON.parse(userInput);
        objToTable(
            dbConnection,
            `bahis_${formDefinition.id_string}`,
            '',
            userInputObj,
            instanceId !== null ? instanceId : userInputObj['meta/instanceID'],
            null,
            '',
            formFieldNames,
        );
    }
};

/** recursively generates insert query and saves to flat table
 * @param {any} dbCon - the better sqlite3 database query
 * @param {Text} tableName - the table name to be inserted
 * @param {Text} parentTableName - the parent table name if exists
 * @param {Object} tableObj - the tableObj containing table values needed to be stored
 * @param {Text} instanceId - the meta instance id generated with each response
 * @param {Number} parentId - the parent id needed to reference in sub repeat tables
 * @param {Text} lastRepeatKeyName - the last repeat key name
 */
const objToTable = (
    dbCon,
    tableName,
    parentTableName,
    tableObj,
    instanceId,
    parentId,
    lastRepeatKeyName,
    possibleFieldNames,
) => {
    const columnNames: string[] = [];
    const fieldValues: any[] = [];
    const repeatKeys: string[] = [];
    for (const key in tableObj) {
        if (possibleFieldNames.includes(key)) {
            const current_entry = tableObj[key];
            const current_entry_array = Array.isArray(current_entry);
            const current_entry_nonzero = current_entry !== null && current_entry.length > 0;
            if (current_entry_array && current_entry_nonzero) {
                repeatKeys.push(key);
            } else {
                let tmpColumnName = key.substring(lastRepeatKeyName.length ? lastRepeatKeyName.length + 1 : 0);
                tmpColumnName = tmpColumnName.replace('/', '_');
                columnNames.push(tmpColumnName);
                fieldValues.push(tableObj[key]);
            }
        }
    }
    let newParentId = null;

    if (columnNames.length > 0 || repeatKeys.length > 0) {
        if (instanceId) {
            columnNames.push('instanceid');
            fieldValues.push(instanceId);
        }
        if (parentId) {
            columnNames.push(`${parentTableName.substring(6)}_id`);
            fieldValues.push(parentId);
        }
        const actualTableName = `${tableName}_table`;
        const actualColumns = columnNames;
        const actualValues = fieldValues;
        const lenFields = columnNames.length;
        const sqliteplaceholder = ', ?'.repeat(lenFields - 1);
        const actualColumnsString = actualColumns.join(',');
        const query = 'INSERT INTO '.concat(
            actualTableName,
            '(',
            actualColumnsString,
            ' ) ',
            'VALUES ',
            '(?',
            sqliteplaceholder,
            ' )',
        );

        try {
            const successfulInsertprep = dbCon.prepare(query);
            const successfulInsert = successfulInsertprep.run(actualValues);
            newParentId = successfulInsert.lastInsertRowid;
        } catch (err) {
            log.info('Insert failed !!!', err, query);
        }
    }
    repeatKeys.forEach((key) => {
        tableObj[key].forEach((elm) => {
            objToTable(
                dbCon,
                `${tableName}_${key.replace('/', '_')}`,
                tableName,
                elm,
                instanceId,
                newParentId,
                key,
                possibleFieldNames,
            );
        });
    });
};

/** checks the array of strings i.e. value not from repeat but from select multiple
 * @param {Array} testArray - the array to check if object presents
 * @returns {Boolean} - true if array not of string; otherwise, false
 */
const isNotArrayOfString = (testArray) => {
    let isObjectFound = false;
    testArray.forEach((arrElm) => {
        if (typeof arrElm === 'object') {
            isObjectFound = true;
        }
    });
    return isObjectFound;
};

/** sends data to server
 * @returns {string} - success if suceess; otherwise failed
 */
const sendDataToServer = async (db, username, mainWindow) => {
    log.debug(mainWindow); // TODO: remove
    log.info('send data', username);

    try {
        const notSyncRowsQuery = db.prepare('Select * from data where status = 0');
        const updateStatusQuery = db.prepare('UPDATE data SET status = 1, instanceid = ? WHERE data_id = ?');
        const last_updated = db.prepare('SELECT last_updated from data order by last_updated desc limit 1').get() as any;
        const updated =
            last_updated == undefined || last_updated.last_updated == null ? 0 : new Date(last_updated.last_updated).valueOf();
        try {
            const notSyncRows = notSyncRowsQuery.all() || [];
            const noRowsToSync = notSyncRows.length;
            log.info(`SYNCING DATA, number of rows to sync ${noRowsToSync}`);
            const url = _url(SUBMISSION_ENDPOINT, username, updated);

            //send data to the server row by row
            const sendRow = async (rowObj) => {
                const formDefinitionObj = db.prepare('Select * from forms where form_id = ?').get(rowObj.form_id);
                let formData = JSON.parse(rowObj.data) || {};
                formData = { ...formData, 'formhub/uuid': formDefinitionObj.form_uuid };
                //We are converting json to XML which is an alternative submission for xforms
                const apiFormData = {
                    xml_submission_file: convertJsonToXml(formData, formDefinitionObj.form_name),
                };

                const jsondata = JSON.stringify(apiFormData);
                log.info('url', url);

                try {
                    const response = await axios.post(url, jsondata, {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                            'Access-Control-Allow-Headers': '*',
                            'Content-Type': 'application/json',
                        },
                    });
                    if (response.data.status === 201 || response.data.status === 201) {
                        deleteDataWithInstanceId(db, JSON.parse(rowObj.data)['meta/instanceID'], rowObj.form_id);
                        updateStatusQuery.run(response.data.id.toString(), rowObj.data_id);
                        JSON.parse(formDefinitionObj.table_mapping).forEach((tableName) => {
                            const updateDataIdQuery = db.prepare(`UPDATE ${tableName}
                                                                  SET instanceid = ?
                                                                  WHERE instanceid = ?`);
                            updateDataIdQuery.run(response.data.id.toString(), JSON.parse(rowObj.data)['meta/instanceID']);
                        });
                    }
                    return true;
                } catch {
                    log.info('Datapoint submission failed!');
                    return jsondata;
                }
            };

            // send new data asynchronous way
            const sendNewData = async () => {
                for (let i = 0; i < notSyncRows.length; i++) {
                    log.info('Send no: ' + i);
                    await sendRow(notSyncRows[i]);
                }
            };

            await sendNewData()
                .then(() => {
                    log.info('submit finished all');
                })
                .catch(() => {
                    log.info('Failed to submit all');
                });
        } catch (err) {
            log.info('Data submission failed!');
        }
        return 'success';
    } catch (err) {
        return 'failed';
    }
};

/** converts json object to xml text
 * @param {Object} jsnObj - the user input json object
 * @param {string} formIdString - the form unique name
 * @returns {string} - the odk format xml string
 */
const convertJsonToXml = (jsnObj, formIdString) => {
    const modifiedJsnObj = {};
    Object.keys(jsnObj).forEach((jsnKey) => {
        const jsnPath = jsnKey.split('/');
        assignJsnValue(modifiedJsnObj, jsnPath, 0, jsnObj[jsnKey]);
    });
    let xmlString = '<?xml version="1.0" encoding="UTF-8" ?>';
    xmlString += `<${formIdString} id="${formIdString}">`;
    Object.keys(modifiedJsnObj).forEach((mkey) => {
        xmlString += generateIndividualXml(mkey, modifiedJsnObj[mkey]);
    });
    xmlString += `</${formIdString}>`;
    return xmlString;
};

/** recursive method that transforms odk json format object to a simpler one
 * @param {Object} mJsnObj - modified json
 * @param {string[]} xPath - the path array generated by splitting the key with '/'
 * @param {number} index - the current index of the xpath
 * @param {any} xvalue - the value to be assigned to the modified object based on xpath key
 */
const assignJsnValue = (mJsnObj, xPath, index, xvalue) => {
    if (index === xPath.length - 1) {
        if (Array.isArray(xvalue) && isNotArrayOfString(xvalue)) {
            if (!(xPath[index] in mJsnObj)) {
                mJsnObj[xPath[index]] = [];
            }
            xvalue.forEach((xvalueItem, xItemindex) => {
                Object.keys(xvalueItem).forEach((jsnKey) => {
                    const jsnPath = jsnKey.split('/');
                    if (!mJsnObj[xPath[index]][xItemindex]) {
                        mJsnObj[xPath[index]][xItemindex] = {};
                    }
                    assignJsnValue(mJsnObj[xPath[index]][xItemindex], jsnPath, index + 1, xvalueItem[jsnKey]);
                });
            });
        } else {
            mJsnObj[xPath[index]] = xvalue;
        }
        return;
    }
    if (!(xPath[index] in mJsnObj)) {
        mJsnObj[xPath[index]] = {};
        assignJsnValue(mJsnObj[xPath[index]], xPath, index + 1, xvalue);
    } else {
        assignJsnValue(mJsnObj[xPath[index]], xPath, index + 1, xvalue);
    }
};

/** transforms individual json key, value to xml attribute based on json value type
 * @param {string} xkey - json key
 * @param {any} xvalue - json value
 * @returns {string} - the transformed xml value
 */
const generateIndividualXml = (xkey, xvalue) => {
    const getObjKey = (value) => {
        const arr = value.split('/');
        return arr[arr.length - 1];
    };

    let tmp = '';
    if (xvalue !== null && xvalue !== undefined) {
        if (Array.isArray(xvalue)) {
            if (xvalue.length > 0) {
                if (xvalue[0].constructor.name === 'Object') {
                    xvalue.forEach((tmpValue) => {
                        tmp += generateIndividualXml(xkey, tmpValue);
                    });
                } else if (xvalue[0].constructor.name === 'Date') {
                    tmp += `<${xkey}>`;
                    xvalue.forEach((tmpValue) => {
                        tmp += `${tmpValue} `;
                    });
                    tmp += `</${xkey}>`;
                } else {
                    tmp += `<${getObjKey(xkey)}>`;
                    xvalue.forEach((tmpValue) => {
                        tmp += `${typeof tmpValue === 'string' ? handleXmlInvalidEntries(tmpValue) : tmpValue} `;
                    });
                    tmp += `</${getObjKey(xkey)}>`;
                }
            }
        } else if (xvalue.constructor.name === 'Object') {
            if (Object.keys(xvalue).length !== 0) {
                tmp += `<${xkey}>`;
                Object.keys(xvalue).forEach((tmpKey) => {
                    tmp += generateIndividualXml(tmpKey, xvalue[tmpKey]);
                });
                tmp += `</${xkey}>`;
            }
        } else if (xvalue.constructor.name === 'Date') {
            tmp += `<${getObjKey(xkey)}>`;
            tmp += xvalue.toISOString();
            tmp += `</${getObjKey(xkey)}>`;
        } else {
            tmp += `<${getObjKey(xkey)}>`;
            tmp += typeof xvalue === 'string' ? handleXmlInvalidEntries(xvalue) : xvalue;
            tmp += `</${getObjKey(xkey)}>`;
        }
    }
    return tmp;
};

/** Replaces invalid xml entries with special xml entries
 * @param {string} affectedString - the string containing invalid xml invalid entries
 * @returns {string} - the modified string with no invalid xml entries
 */
const handleXmlInvalidEntries = (affectedString) => {
    let tmpString = affectedString;
    tmpString = tmpString.replace('&', '&amp;');
    tmpString = tmpString.replace('<', '&lt;');
    tmpString = tmpString.replace('>', '&gt;');
    return tmpString;
};

// subscribes the listeners to channels
ipcMain.handle('fetch-app-definition', fetchAppDefinition);
ipcMain.on('submit-form-response', submitFormResponse);
ipcMain.on('fetch-form-definition', fetchFormDefinition);
ipcMain.on('fetch-form-choices', fetchFormChoices);
ipcMain.on('fetch-list-definition', fetchListDefinition);
ipcMain.on('submitted-form-definition', fetchFormListDefinition);
ipcMain.on('fetch-list-followup', fetchFollowupFormData);
ipcMain.on('fetch-query-data', fetchQueryData);
ipcMain.on('start-app-sync', startAppSync);
ipcMain.on('request-data-sync', requestDataSync);
ipcMain.on('fetch-filter-dataset', fetchFilterDataset);
ipcMain.on('sign-in', signIn);
ipcMain.on('fetch-userlist', fetchUserList);
ipcMain.on('fetch-geo', fetchGeo);
ipcMain.on('fetch-image', fetchImage);
ipcMain.on('fetch-username', fetchUsername);
ipcMain.on('export-xlsx', exportExcel);
ipcMain.on('delete-instance', deleteData);
ipcMain.on('form-details', fetchFormDetails);
ipcMain.on('user-db-info', getUserDBInfo);
ipcMain.on('change-user', changeUser);
