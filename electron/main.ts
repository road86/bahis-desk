import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import log from 'electron-log';
import path from 'node:path';
import axios from 'axios';
import { random } from 'lodash';
import { existsSync, unlinkSync, writeFile, writeFileSync, cp, rm, mkdirSync } from 'fs';
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

// SETUP
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

// logging setup - keep at top of file
log.transports.file.resolvePath = () => 'electron-debug.log';
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {scope} {text}';
log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] {scope} {text}';
log.warn(`Full debug logs can be found in ${path.join(process.env.DIST, 'debug.log')}`);
autoUpdater.logger = log;

const APP_VERSION = app.getVersion();
export const BAHIS_SERVER_URL = import.meta.env.VITE_BAHIS_SERVER_URL || 'http://localhost:3001';

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
        cp(old_app_location, app.getPath('userData'), { recursive: true }, (error) => {
            log.error('Failed to migrate user data from old location');
            log.error(error?.message);
        });
        rm(old_app_location, { recursive: true }, (error) => {
            log.error('Failed to delete user data from old location');
            log.error(error?.message);
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
log.info(`BAHIS2_SERVER_URL=${BAHIS2_SERVER_URL}`);
log.info(`BAHIS_SERVER_URL=${BAHIS_SERVER_URL} (BAHIS 3)`);
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

// BAHIS3 HELPERS
const _url = (url, time?) => {
    if (time !== null && time !== undefined) {
        return `${url}?last_modified=${time}&bahis_desk_version=${APP_VERSION}`;
    } else {
        return `${url}?bahis_desk_version=${APP_VERSION}`;
    }
};

// listeners

const fetchFilterDataset = (event, listId, filterColumns) => {
    // fetches the filter dataset needed to render single select and multiple select options
    log.info(`fetchFilterDataset ${event.type} ${listId} ${filterColumns}`);
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
    } catch (error) {
        log.info(`fetchFilterDataset Error ${error?.message}`);

        event.returnValue = [];
    }
};

const fetchAppDefinition = async (event) => {
    // fetches the app menu definition
    log.info(`fetchAppDefinition ${event.type}`);
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
    } catch (error) {
        log.info(`fetchAppDefinition FAILED ${error?.message}`);
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
    log.info(`fetchFormDefinition ${event.type} ${formId}`);
    try {
        const formDefinitionObj = db.prepare('SELECT * from forms2 where id = ? limit 1').get(formId) as any;
        if (formDefinitionObj != undefined) {
            const choiceDefinition = formDefinitionObj.choice_definition
                ? JSON.parse(formDefinitionObj.choice_definition)
                : {};
            const choices = {};
            Object.keys(choiceDefinition).forEach((key) => {
                try {
                    const { query } = choiceDefinition[key];
                    choices[`${key}.csv`] = db.prepare(query).all();
                } catch (error) {
                    log.info(`Choice Definition Error  ${error?.message}`);
                }
            });

            log.info(`Choices for form ${formId}:  ${choices}`);
            event.returnValue = { ...formDefinitionObj, formChoices: JSON.stringify(choices) };
        } else {
            event.returnValue = null;
            log.info(`fetchFormDefinition problem, no such form with ${formId}`);
        }
    } catch (error) {
        log.info(`fetchFormDefinition Error  ${error?.message}`);
    }
};

const fetchFormChoices = (event, formId) => {
    try {
        log.info(`fetchFormChoices  ${formId}`);
        const formchoices = db.prepare(`SELECT * from form_choices where xform_id = ? `).all(formId);
        event.returnValue = formchoices;
    } catch (error) {
        log.info('error fetch form choices ', error?.message);
    }
};

const fetchFormDetails = (event, listId, column = 'data_id') => {
    log.info(`fetchFormDetails  ${event.type} ${listId}`);
    try {
        const formData = db.prepare(`SELECT * from data where ${column} = ? limit 1`).get(listId);
        log.info(formData);
        if (formData != undefined) {
            event.returnValue = { formDetails: formData };
        } else {
            event.returnValue = null;
        }
    } catch (error) {
        log.info(`Fetch FormDetails`);
        log.info(error?.message);
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
        log.info('fetchQueryData FAILED');
        log.info(error?.message);
        event.returnValue = []; //lack of return here was hanging the frontend which incorectly used sendSync
    }
};

const changeUser = async (event, obj) => {
    deleteLocalDatabase2(MODE, db);
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

    const SIGN_IN_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/app-user-verify/`;

    const getErrorMessage = (error) => {
        log.info(error?.message);
        if (error?.message.includes('403')) {
            return 'Only upazilas can use BAHIS-desk, please contact support.';
        }
        if (error?.message.includes('409')) {
            return 'Users credentials are not authorized or missing catchment area.';
        }
        return 'Unauthenticated User.';
    };

    const query = 'SELECT * from users limit 1';
    let userInfo = db.prepare(query).get() as any;
    log.info('userInfo');
    log.info(userInfo);
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
    log.debug(`exporting Excel due to ${event.type}`);
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

            writeFile(filename, new Buffer(excelData), (error) => {
                if (error) {
                    log.info(`an error occured with file creation,  ${error?.message}`);
                    dialog.showMessageBox({
                        title: 'Download Updates',
                        message: `an error ocurred with file creation ${error?.message}`,
                    });
                    return;
                }
                dialog.showMessageBox({
                    title: 'Download Updates',
                    message: 'File Downloaded Successfully',
                });
            });
        })
        .catch((error) => {
            dialog.showMessageBox({
                title: 'Download Updates',
                message: `${error?.message}`,
            });
            log.info(`export excel error: ${error?.message}`);
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
    } catch (error) {
        log.info(`fetchUsername FAILED ${error?.message}`);
    }
};

const fetchUserList = (event) => {
    try {
        const fetchedRows = db.prepare('SELECT DISTINCT	username, name FROM users').all();

        log.info(fetchedRows);
        event.returnValue = {
            users: fetchedRows,
        };
    } catch (error) {
        log.info(error?.message);
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
    } catch (error) {
        log.info(`userDBInfo FAILED ${error?.message}`);
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
    log.debug(`due to ${event.type}`);

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
        getModules(),
        getWorkflows(),
        getForms(),
        getTaxonomies(),
        getAdministrativeRegions(),
    ])
        .then(() => {
            updateAppLastSyncTime();
            mainWindow?.webContents.send('formSyncComplete', 'done'); // done is a keyword checked later
            log.info('Pulling app data successfully completed');
        })
        .catch((error) => {
            log.warn('Pulling app data failed with:\n', error?.message);
        });
};

const postLocalData = async (event, username) => {
    log.info('POST local data to server');
    log.debug(`due to ${event.type}`);

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
            log.info('POST local data SUCCESS');
        })
        .catch((error) => {
            log.warn('POST local data FAILED with\n', error?.message);
        });
};

const getModules = async () => {
    log.info(`GET Module Definitions`);

    const BAHIS_MODULE_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/api/desk/modules`;
    const api_url = _url(BAHIS_MODULE_DEFINITION_ENDPOINT);
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of the user's role
    // FIXME this API endpoint needs to take care of auth

    axios
        .get(api_url)
        .then((response) => {
            if (response.data) {
                log.info('Modules received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO module (id, title, icon, description, form, external_url, sort_order, parent_module, module_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, icon = excluded.icon, description = excluded.description, form = excluded.form, external_url = excluded.external_url, sort_order = excluded.sort_order, parent_module = excluded.parent_module, module_type = excluded.module_type;',
                );
                const deleteQuery = db.prepare('DELETE FROM module WHERE id = ?');

                for (const module of response.data) {
                    if (module.is_active) {
                        upsertQuery.run([
                            module.id,
                            module.title,
                            module.icon,
                            module.description,
                            module.form,
                            module.external_url,
                            module.sort_order,
                            module.parent_module,
                            module.module_type,
                        ]);
                    } else {
                        log.info(`Deleting module ${module.id} from local database as no longer active`);
                        deleteQuery.run([module.id]);
                    }
                }
            }
            log.info('GET Module Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET Module Definitions FAILED with\n', error?.message);
        });
};

const getWorkflows = async () => {
    log.info(`GET Workflow Definitions`);

    const BAHIS_WORKFLOW_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/api/desk/workflows`;
    const api_url = _url(BAHIS_WORKFLOW_DEFINITION_ENDPOINT);
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of auth

    axios
        .get(api_url)
        .then((response) => {
            if (response.data) {
                log.info('Workflows received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO workflow (id, title, source_form, destination_form, definition) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, definition = excluded.definition;',
                );
                const deleteQuery = db.prepare('DELETE FROM workflow WHERE id = ?');

                for (const workflow of response.data) {
                    if (workflow.is_active) {
                        upsertQuery.run([
                            workflow.id,
                            workflow.title,
                            workflow.source_form,
                            workflow.destination_form,
                            JSON.stringify(workflow.definition),
                        ]);
                    } else {
                        log.info(`Deleting workflow ${workflow.id} from local database as no longer active`);
                        deleteQuery.run([workflow.id]);
                    }
                }
            }
            log.info('GET Workflow Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET Workflow Definitions FAILED with\n', error?.message);
        });
};

const getForms = async () => {
    log.info(`GET KoboToolbox Form Definitions`);

    const BAHIS_KOBOTOOLBOX_API_ENDPOINT = 'https://kf.kobotoolbox.org/api/v2/';
    log.info(`KOBOTOOLBOX API URL: ${BAHIS_KOBOTOOLBOX_API_ENDPOINT}`);
    const axios_config = {
        headers: {
            Authorization: `Token ${import.meta.env.VITE_KOBO_API_TOKEN}`,
        },
    };
    // FIXME this API endpoint needs to take care of auth in a dynamic fashion

    log.info('GET Form UIDs from KoboToolbox');
    const formList = await axios
        .get(BAHIS_KOBOTOOLBOX_API_ENDPOINT + 'assets', axios_config)
        .then((response) => {
            const formList = response.data.results
                .filter((asset) => asset.has_deployment)
                .map((asset) => ({
                    uid: asset.uid,
                    name: asset.name,
                    description: asset.settings.description,
                    xml_url: asset.downloads
                        .filter((download) => download.format === 'xml')
                        .map((download) => download.url)[0],
                }));
            log.info(`GET Form UIDs SUCCESS`);
            return formList;
        })
        .catch((error) => {
            log.warn('GET KoboToolbox Form Definitions FAILED with\n', error?.message);
        });

    const upsertQuery = db.prepare(
        'INSERT INTO form (uid, name, description, xml) VALUES (?, ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET xml = excluded.xml;',
    );
    for (const form of formList) {
        log.info(`GET form ${form.uid} from KoboToolbox`);
        log.debug(form.xml_url);
        axios
            .get(form.xml_url, axios_config)
            .then((response) => {
                const deployment = response.data;
                upsertQuery.run([form.uid, form.name, form.description, deployment]);
                log.info(`GET form ${form.uid} SUCCESS`);
            })
            .catch((error) => {
                log.warn(`GET KoboToolbox Form Definitions FAILED with\n${error?.message}`);
            });
    }
    log.info(`GET KoboToolbox Form Definitions SUCCESS`);
};

const getTaxonomies = async () => {
    log.info(`GET Taxonomy Definitions`);

    const BAHIS_TAXONOMY_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/api/taxonomy/taxonomies`;
    const api_url = _url(BAHIS_TAXONOMY_DEFINITION_ENDPOINT);
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of auth

    log.info('GET Taxonomy List from server');
    const taxonomyList = await axios
        .get(api_url)
        .then((response) => {
            log.info('GET Taxonomy List SUCCESS');
            return response.data;
        })
        .catch((error) => {
            log.warn('GET Taxonomy List FAILED with\n', error?.message);
        });

    const upsertQuery = db.prepare('INSERT INTO taxonomy (slug, csv_file) VALUES (?, ?);');
    const BAHIS_TAXONOMY_CSV_ENDPOINT = (filename) => `${BAHIS_SERVER_URL}/media/${filename}`;

    for (const taxonomy of taxonomyList) {
        log.info(`GET Taxonomy CSV ${taxonomy.slug} from server`);
        // FIXME this API endpoint needs to take care of auth
        axios
            .get(BAHIS_TAXONOMY_CSV_ENDPOINT(taxonomy.csv_file_stub))
            .then((response) => {
                try {
                    if (!existsSync(`${app.getAppPath()}/taxonomies/`)) {
                        log.info('Creating taxonomies directory');
                        mkdirSync(`${app.getAppPath()}/taxonomies/`);
                    }
                    writeFileSync(`${app.getAppPath()}/${taxonomy.csv_file_stub}`, response.data, 'utf-8');
                } catch (error) {
                    log.warn('GET Taxonomy CSV FAILED while saving with\n', error?.message);
                }
                upsertQuery.run([taxonomy.slug, taxonomy.csv_file_stub]);
                log.info(`GET Taxonomy CSV ${taxonomy.slug} SUCCESS`);
            })
            .catch((error) => {
                log.warn(`GET Taxonomy CSV FAILED with\n${error?.message}`);
            });
    }
};

const getAdministrativeRegions = async () => {
    log.info(`GET getAdministrativeRegionLevels Definitions`);

    const BAHIS_ADMINISTRATIVE_REGION_LEVELS_ENDPOINT = `${BAHIS_SERVER_URL}/api/taxonomy/administrative-region-levels`;
    const api_levels_url = _url(BAHIS_ADMINISTRATIVE_REGION_LEVELS_ENDPOINT);
    log.info(`API URL: ${api_levels_url}`);
    // FIXME this API endpoint needs to take care of auth

    axios
        .get(api_levels_url)
        .then((response) => {
            if (response.data) {
                log.info('Administrative Region Levels received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO administrativeregionlevel (id, title) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title;',
                );

                for (const administrativeregionlevel of response.data) {
                    upsertQuery.run([administrativeregionlevel.id, administrativeregionlevel.title]);
                }
            }
            log.info('GET getAdministrativeRegionLevels Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET getAdministrativeRegionLevels Definitions FAILED with\n', error?.message);
        });

    log.info(`GET getAdministrativeRegions Definitions`);

    const BAHIS_ADMINISTRATIVE_REGIONS_ENDPOINT = `${BAHIS_SERVER_URL}/api/taxonomy/administrative-regions`;
    const api_url = _url(BAHIS_ADMINISTRATIVE_REGIONS_ENDPOINT);
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of auth

    axios
        .get(api_url)
        .then((response) => {
            if (response.data) {
                log.info('Administrative Regions received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO administrativeregion (id, title, parent_administrative_region, administrative_region_level) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, parent_administrative_region = excluded.parent_administrative_region, administrative_region_level = excluded.administrative_region_level;',
                );

                for (const administrativeregion of response.data) {
                    upsertQuery.run([
                        administrativeregion.id,
                        administrativeregion.title,
                        administrativeregion.parent_administrative_region,
                        administrativeregion.administrative_region_level,
                    ]);
                }
            }
            log.info('GET getAdministrativeRegions Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET getAdministrativeRegions Definitions FAILED with\n', error?.message);
        });
};

const refreshDatabase = () => {
    try {
        deleteLocalDatabase2(MODE, db);
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

// new
ipcMain.handle('request-module-sync', getModules);
ipcMain.handle('request-workflow-sync', getWorkflows);
ipcMain.handle('request-form-sync', getForms);
ipcMain.handle('request-taxonomy-sync', getTaxonomies);
ipcMain.handle('request-administrative-region-sync', getAdministrativeRegions);
