import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import log from 'electron-log';
import path from 'node:path';
import axios from 'axios';
import { random } from 'lodash';
import { existsSync, unlinkSync, writeFile, cp, rm } from 'fs';
import firstRun from 'electron-first-run'; // could this eventually be removed too?
import { autoUpdater } from 'electron-updater';
import {
    BAHIS2_SERVER_URL,
    deleteDataWithInstanceId2,
    parseAndSaveToFlatTables2,
    getCSVData2,
    getCatchments2,
    getFormChoices2,
    getFormConfig2,
    getFormSubmissions2,
    getForms2,
    getLists2,
    getModuleDefinitions2,
    postFormSubmissions2,
} from './sync2';
import { createLocalDatabase2, createOrReadLocalDatabase2, updateFreshLocalDatabase2, deleteLocalDatabase2 } from './localDB2';

// variables

export const APP_VERSION = app.getVersion();
const SIGN_IN_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/app-user-verify/`;

// setup

process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

// logging setup - keep at top of file
log.transports.file.resolvePath = () => 'electron-debug.log';
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {scope} {text}';
log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] {scope} {text}';
log.warn(`Full debug logs can be found in ${path.join(process.env.DIST, 'debug.log')}`);
autoUpdater.logger = log;

const APP_VERSION = app.getVersion();
export const BAHIS_SERVER_URL = import.meta.env.VITE_BAHIS2_SERVER_URL || 'http://localhost';

// default environment variables, i.e. for local development
export const MODE = import.meta.env.MODE || 'development';

// set environment variables based on mode
switch (MODE) {
    case 'development':
        log.transports.file.level = 'silly';
        log.transports.console.level = 'silly';
        log.transports.ipc!.level = false; // we turn this off until we can upgrade to electron-log v5 as we can't format it - all the information it would show is found in the main console and the log file anyway
        break;
    case 'production':
        log.info('Running in production mode');
        log.transports.file.level = 'info';
        log.transports.console.level = 'warn';
        log.transports.ipc!.level = false;
        break;
    default:
        log.error(`Unknown mode: ${MODE}`);
        break;
}

// MIGRATION
// The following code migrates user data from bahis-desk <=v2.3.0
// to a new location used in later version (in preparation for v3.0)
// This code can be removed once we are confident that all users have upgraded to v3.0
const migrate = (old_app_location) => {
    if (existsSync(old_app_location)) {
        log.warn(`Migrating user data from old location: ${old_app_location}`);
        cp(old_app_location, app.getPath('userData'), { recursive: true }, (err) => {
            log.error('Failed to migrate user data from old location');
            log.error(err);
        });
        rm(old_app_location, { recursive: true }, (err) => {
            log.error('Failed to delete user data from old location');
            log.error(err);
        });
    }
};
switch (MODE) {
    case 'development':
        migrate(path.join(app.getPath('userData'), '..', 'devbahis/'));
        break;
    case 'production':
        migrate(path.join(app.getPath('userData'), '..', 'bahis/'));
        break;
    default:
        log.error(`Unknown mode: ${MODE}`);
        break;
}



// report the status of environment variables and logging
log.info(`Running version ${APP_VERSION} in ${MODE} mode with the following environment variables:`);
log.info(`BAHIS_SERVER_URL=${BAHIS_SERVER_URL}`);
log.info(
    `Using the following log settings: file=${log.transports.file.level}; console=${log.transports.console.level}; ipc=${
        log.transports.ipc!.level
    }`,
);

// Initialise local DB
let db = createOrReadLocalDatabase2(MODE);

let mainWindow: BrowserWindow | null;

const createWindow = () => {
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
};

const autoUpdateBahis = () => {
    log.info('Checking for the app software updates call');
    if (MODE !== 'development') {
        autoUpdater.checkForUpdatesAndNotify();
    } else {
        log.info('Not checking for updates in dev mode');
    }
};

/** adds window on app if window null */
app.whenReady().then(() => {
    const isFirstRun = firstRun();
    if (!isFirstRun) {
        //we don't check for auto update on the first run, apparently that can cause problems
        autoUpdateBahis();
    }

    createWindow();
});

app.on('window-all-closed', () => {
    mainWindow = null;
    db.close();
    app.quit();
});

const isMac = process.platform === 'darwin';

const template: Electron.MenuItemConstructorOptions[] = [
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            {
                label: 'Reset Database',
                click: () => {
                    const browserWindow = BrowserWindow.getFocusedWindow();
                    if (browserWindow) {
                        const status = dialog.showMessageBoxSync(browserWindow, {
                            title: 'Confirm',
                            message: `Are you sure?`,
                            type: 'warning',
                            buttons: ['Yes', 'Cancel'],
                            cancelId: 1,
                            noLink: true,
                        });
                        if (status === 0) {
                            mainWindow?.webContents.send('init-refresh-database');
                        }
                    }
                },
            },
            isMac ? { role: 'close' } : { role: 'quit' },
        ],
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ],
    },
    // { role: 'helpMenu' }
    {
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: () => {
                    const browserWindow = BrowserWindow.getFocusedWindow();
                    if (browserWindow) {
                        return dialog.showMessageBox(browserWindow, {
                            title: 'About BAHIS',
                            message: `
                                BAHIS
                                Version ${APP_VERSION}
                                `,
                            type: 'info',
                        });
                    }
                },
            },
        ],
    },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);


// listeners

const fetchFilterDataset = (event, listId, filterColumns) => {
    // fetches the filter dataset needed to render single select and multiple select options
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

const fetchAppDefinition = async (event) => {
    // fetches the app menu definition
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
    deleteDataWithInstanceId2(db, JSON.parse(response.data)['meta/instanceID'], response.formId);
    const fetchedUsername = getCurrentUser();
    event.returnValue = {
        username: fetchedUsername,
    };
    const date = new Date().toISOString();
    const insert = db.prepare(
        'INSERT INTO data (form_id, data, status,  submitted_by, submission_date, instanceid) VALUES (?, ?, 0, ?, ?, ?)',
    );
    insert.run(response.formId, response.data, fetchedUsername, date, JSON.parse(response.data)['meta/instanceID']);
    parseAndSaveToFlatTables2(db, response.formId, response.data, null);
    log.info('submitFormResponse COMPLETE');
};

const fetchFormDefinition = (event, formId) => {
    // fetches the form definition
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

const fetchListDefinition = (event, listId) => {
    // fetches the list definition
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

const getCurrentUser = () => {
    const query = 'SELECT username from users LIMIT 1';
    const fetchedRow = db.prepare(query).get() as any;
    return fetchedRow.username;
};

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

const fetchQueryData = (event, queryString) => {
    // fetches the data based on query
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

const changeUser = async (event, obj) => {
    deleteLocalDatabase2(db, MODE);
    db = createLocalDatabase2(MODE);

    const { response, userData } = obj;
    updateFreshLocalDatabase2(response, userData, db);

    const results = { username: response.user_name, message: 'changeUser' };
    mainWindow?.webContents.send('formSubmissionResults', results);
    event.returnValue = {
        userInfo: response,
    };
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
                        updateFreshLocalDatabase2(response.data, userData, db);
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
    deleteDataWithInstanceId2(db, instanceId, formId);
    event.returnValue = {
        status: 'successful',
    };
};

// main sync functions
const getAppData = async (event, username) => {
    log.info('Getting app data from server');
    log.debug(`due to ${event}`);

    const readAppLastSyncTime = () => {
        const logged_time = db.prepare('SELECT * from app_log order by time desc limit 1').get() as any;
        return logged_time === undefined ? 0 : Math.round(logged_time.time);
    };

    const updateAppLastSyncTime = () => {
        const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
        newLayoutQuery.run(Date.now());
    };

    const last_sync_time = readAppLastSyncTime();
    log.info(`Last Sync Time: ${last_sync_time}`);

    await Promise.all([
        getForms2(username, last_sync_time, db),
        getLists2(username, last_sync_time, db),
        getFormChoices2(username, last_sync_time, db),
        getModuleDefinitions2(username, last_sync_time, db),
        getFormConfig2(username, 0, db),
        getCatchments2(username, 0, db),
    ])
        .then(() => {
            updateAppLastSyncTime();
            mainWindow?.webContents.send('formSyncComplete', 'done'); // done is a keyword checked later
            log.info('Pulling app data successfully completed');
        })
        .catch((err) => {
            log.warn('Pulling app data failed with:\n', err);
        });
};

const postLocalData = async (event, username) => {
    log.info('Posting local data to server');
    log.debug(`due to ${event}`);

    const readDataLastSyncTime = () => {
        const logged_time = db.prepare('SELECT last_updated from data order by last_updated desc limit 1').get() as any;
        return logged_time == undefined || logged_time.last_updated == null ? 0 : new Date(logged_time.last_updated).valueOf();
    };

    const updateDataLastSyncTime = () => {
        const newLayoutQuery = db.prepare('INSERT INTO csv_sync_log(time) VALUES(?)');
        newLayoutQuery.run(Date.now());
    };

    const last_sync_time = readDataLastSyncTime();
    log.info(`Last Sync Time: ${last_sync_time}`);

    let msg: any;
    await postFormSubmissions2(username, last_sync_time, db)
        .then(async (r) => {
            msg = r;
            await getFormSubmissions2(username, last_sync_time, db);
        })
        .then(async () => {
            await getCSVData2(username, last_sync_time, db);
        })
        .then(() => {
            updateDataLastSyncTime();
            event.returnValue = msg;
            mainWindow?.webContents.send('dataSyncComplete', 'synchronised');
            log.info('Pushing local data successfully completed');
        })
        .catch((err) => {
            log.warn('Pushing local data failed with:\n', err);
        });
};

const refreshDatabase = () => {
    try {
        deleteLocalDatabase2(db, MODE);
        db = createLocalDatabase2(MODE);
        return 'success';
    } catch (e) {
        console.log(e);
        return 'failed';
    }
};

// subscribes the listeners to channels
//original
ipcMain.handle('fetch-app-definition', fetchAppDefinition);
ipcMain.on('submit-form-response', submitFormResponse);
ipcMain.on('fetch-form-definition', fetchFormDefinition);
ipcMain.on('fetch-form-choices', fetchFormChoices);
ipcMain.on('fetch-list-definition', fetchListDefinition);
ipcMain.on('submitted-form-definition', fetchFormListDefinition);
ipcMain.on('fetch-list-followup', fetchFollowupFormData);
ipcMain.on('fetch-query-data', fetchQueryData);
ipcMain.on('fetch-filter-dataset', fetchFilterDataset);
ipcMain.on('sign-in', signIn);
ipcMain.on('fetch-userlist', fetchUserList);
ipcMain.on('fetch-username', fetchUsername);
ipcMain.on('export-xlsx', exportExcel);
ipcMain.on('delete-instance', deleteData);
ipcMain.on('form-details', fetchFormDetails);
ipcMain.on('user-db-info', getUserDBInfo);
ipcMain.on('change-user', changeUser);
ipcMain.on('refresh-database', refreshDatabase);

// refactored
ipcMain.on('start-app-sync', getAppData);
ipcMain.on('request-data-sync', postLocalData);
