import axios from 'axios';
import csv from 'csv-parser';
import { BrowserWindow, Menu, app, dialog, ipcMain } from 'electron';
import firstRun from 'electron-first-run'; // could this eventually be removed too?
import { autoUpdater } from 'electron-updater';
import { cp, createReadStream, existsSync, writeFile } from 'fs';
import path from 'node:path';
import { create } from 'xmlbuilder2';
import { createLocalDatabase2, createOrReadLocalDatabase2, deleteLocalDatabase2, updateFreshLocalDatabase2 } from './localDB2';
import { log } from './log';
import {
    BAHIS_SERVER_URL,
    getAdministrativeRegions,
    getFormCloudSubmissions,
    getForms,
    getModules,
    getTaxonomies,
    getWorkflows,
    postFormCloudSubmissions,
} from './sync';
import {
    BAHIS2_SERVER_URL,
    deleteDataWithInstanceId2,
    getCSVData2,
    getCatchments2,
    getFormChoices2,
    getFormConfig2,
    getFormSubmissions2,
    getForms2,
    getLists2,
    getModuleDefinitions2,
    parseAndSaveToFlatTables2,
    postFormSubmissions2,
} from './sync2';

// SETUP
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

const APP_VERSION = app.getVersion();

// default environment variables, i.e. for local development
export const MODE = import.meta.env.MODE || 'development';

// set environment variables based on mode
switch (MODE) {
    case 'development':
        log.info('Running in dev mode');
        log.transports[0].level = 'silly'; // console
        log.transports[1].level = 'silly'; // file

        break;
    case 'production':
        log.info('Running in production mode');
        log.transports[0].level = 'warn'; // console
        log.transports[1].level = 'info'; // file
        break;
    default:
        log.error(`Unknown mode: ${MODE}`);
        break;
}

// logging setup
autoUpdater.logger = log;
log.info(`Using the following log settings: console=${log.transports[0].level}; file=${log.transports[1].level}}`);
log.info(`Full debug logs can be found in ${path.join(process.env.DIST, 'electron-debug.log')}`);

// MIGRATION
// The following code migrates user data from bahis-desk <=v2.3.0
// to a new location used in later version (in preparation for v3.0)
// This code can be removed once we are confident that all users have upgraded to v3.0
const migrate = (old_app_location) => {
    if (existsSync(old_app_location)) {
        log.warn(`Migrating user data from old location: ${old_app_location}`);
        log.debug(`Old location: ${old_app_location}`);
        log.debug(`New location: ${app.getPath('userData')}`);
        cp(old_app_location, app.getPath('userData'), { recursive: true }, (error) => {
            log.error('Failed to migrate user data from old location');
            log.error(error);
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
        log.error('fetchFilterDataset Error');
        log.error(error);

        event.returnValue = [];
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
                    log.error('Choice Definition Error:');
                    log.error(error);
                }
            });

            log.info(`Choices for form ${formId}:  ${choices}`);
            event.returnValue = { ...formDefinitionObj, formChoices: JSON.stringify(choices) };
        } else {
            event.returnValue = null;
            log.warn(`fetchFormDefinition problem, no such form with ${formId}`);
        }
    } catch (error) {
        log.error('fetchFormDefinition Error:');
        log.error(error);
    }
};

const fetchFormChoices = (event, formId) => {
    try {
        log.info(`fetchFormChoices  ${formId}`);
        const formchoices = db.prepare(`SELECT * from form_choices where xform_id = ? `).all(formId);
        event.returnValue = formchoices;
    } catch (error) {
        log.error('fetchFormChoices FAILED with:');
        log.error(error);
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
        log.error('fetchFormDetails FAILED with:');
        log.error(error);
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
        log.error(`fethcListDefinition Error, listId: ${listId}`);
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
        log.error(`fetchFormListDefinition, listId: ${formId}`);
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

/** DEVNOTE
 * There are five scenarios in sign in process
 * 1. First, we check if the user exists in the local database with the correct password
 * if so, we let them sign in (offline-user-success)
 * 2. If the user exists in the local database but the password is incorrect,
 * we show an error message to the user (offline-user-fail)
 * 3. However, if the user conflicts with that in the local database,
 * we show the ChangeUserDialog and confirm resetting the database before... (change-user)
 * 4. Else, we send a request to the server to verify the user and, if the request suceeds,
 * we update the local database with the user's information
 * and let them sign in (fresh-user-success)
 * 5. Finally, if this request fails we show an error message to the user (fresh-user-fail)
 */
const signIn = async (event, userData) => {
    log.info(`Attempting electron-side signIn for ${userData.username}`);
    log.debug(event);

    const SIGN_IN_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/app-user-verify/`;
    const current_user = db.prepare('SELECT * from users2 limit 1').get();

    if (current_user) {
        log.info(`User exists in the current database - ${current_user.username}`);
    }

    if (current_user && userData && current_user.username == userData.username && current_user.password == userData.password) {
        log.info('This is an offline-ready account.');
        return 'offline-user-success';
    } else if (
        current_user &&
        userData &&
        current_user.username === userData.username &&
        current_user.password !== userData.password
    ) {
        log.info('This is an offline-ready account but the credentials are incorrect.');
        return 'offline-user-fail';
    } else if (current_user && userData && current_user.username !== userData.username) {
        log.info('Change of user requested - handing back for confirmation.');
        return 'change-user';
    } else {
        log.info('Attempt to sign in to the BAHIS server');
        const data = {
            username: userData.username,
            password: userData.password,
            bahis_desk_version: APP_VERSION,
        };
        log.info(`signin url: ${SIGN_IN_ENDPOINT}`);

        return await axios
            .post(SIGN_IN_ENDPOINT, data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => {
                if (response.status === 200 && response.data.user_name === userData.username) {
                    log.info('BAHIS server sign in received a 200 response');

                    updateFreshLocalDatabase2(response.data, userData, db);
                    log.info('Local db configured');

                    return 'fresh-user-success';
                } else {
                    log.info('BAHIS server sign in received a non-200 response');
                    return 'fresh-user-fail';
                }
            })
            .catch((error) => {
                log.error('Sign In Error');
                log.error(error);
                return 'error';
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
                    log.error('an error occured with file creation:');
                    log.error(error);
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
            log.error('export excel error:');
            log.error(error);
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
        log.error('fetchUsername FAILED with:');
        log.error(error);
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
            log.warn('userDB FAILED - undefined');
        }
    } catch (error) {
        log.error('userDBInfo FAILED with:');
        log.error(error);
    }
};

const deleteData = (event, instanceId, formId) => {
    log.info(instanceId, formId);
    deleteDataWithInstanceId2(db, instanceId, formId);
    event.returnValue = {
        status: 'successful',
    };
};

const getLocalDB = async (event, query) => {
    log.info(`GET from local DB with query: ${query}`);
    log.debug(`due to ${event.type}`);

    return new Promise<string>((resolve, reject) => {
        try {
            const fetchedRows = db.prepare(query).all();
            log.info('GET from local DB SUCCESS');
            resolve(fetchedRows);
        } catch (error) {
            log.error('GET from local DB FAILED with:');
            log.error(error);
            reject(error);
        }
    });
};

const postLocalDB = (event, query) => {
    log.info(`POST to local DB with query: ${query}`);
    log.debug(`due to ${event.type}`);

    return new Promise<boolean>((resolve, reject) => {
        try {
            db.prepare(query).run();
            log.info('POST to local DB SUCCESS');
            resolve(true);
        } catch (error) {
            log.error('POST to local DB FAILED with');
            log.error(error);
            reject(error);
        }
    });
};

const getAppData = async (event) => {
    log.info('GET app data from server');
    log.debug(`due to ${event.type}`);

    const readAppLastSyncTime = () => {
        const logged_time = db.prepare('SELECT * from app_log order by time desc limit 1').get() as any;
        return logged_time === undefined ? 0 : Math.round(logged_time.time);
    };

    const updateAppLastSyncTime = () => {
        const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
        newLayoutQuery.run(Date.now());
    };

    const username = db.prepare('SELECT username from users limit 1').get().username;

    const last_sync_time = readAppLastSyncTime();
    log.info(`Last Sync Time: ${last_sync_time}`);

    await Promise.all([
        getForms2(username, last_sync_time, db),
        getLists2(username, last_sync_time, db),
        getFormChoices2(username, last_sync_time, db),
        getModuleDefinitions2(username, last_sync_time, db),
        getFormConfig2(username, 0, db),
        getCatchments2(username, 0, db),
        getModules(db),
        getWorkflows(db),
        getForms(db).then(() => getFormCloudSubmissions(db)),
        getTaxonomies(db),
        getAdministrativeRegions(db),
    ])
        .then(() => {
            updateAppLastSyncTime();
            mainWindow?.webContents.send('formSyncComplete', 'done'); // done is a keyword checked later // TODO check actually used or needed?
            log.info('GET app data SUCCESS');
        })
        .catch((error) => {
            log.error('GET app data FAILED with:');
            log.error(error);
        });
};

const postGetUserData = async (event) => {
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

    const username = db.prepare('SELECT username from users limit 1').get().username;

    const last_sync_time = readDataLastSyncTime();
    log.info(`Last Sync Time: ${last_sync_time}`);

    // BAHIS 2 data
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
            mainWindow?.webContents.send('dataSyncComplete', 'synchronised'); // FIXME combine with app data sync message?
            log.info('POST local data SUCCESS');
        })
        .catch((error) => {
            log.error('POST local data FAILED with:');
            log.error(error);
        });

    // BAHIS 3 data
    await postFormCloudSubmissions(db).then(() => getFormCloudSubmissions(db));
};
};

const readTaxonomyCSV = (filePath: string) => {
    const data: any[] = [];

    return new Promise((resolve, reject) => {
        createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => data.push(row))
            .on('end', () => {
                const xml = xmlbuilder.create('root');
                data.forEach((row) => {
                    const item = xml.ele('item');
                    Object.keys(row).forEach((key) => {
                        item.ele(key, row[key]);
                    });
                });
                resolve(xml.end({ pretty: true }));
            })
            .on('error', reject);
    });
};

const readTaxonomy = async (event, filePath: string) => {
    log.info(`READ taxonomy CSV at ${filePath}`);
    try {
        const xml = await readTaxonomyCSV(filePath);
        log.info(`READ taxonomy CSV at ${filePath} SUCCESS`);
        return xml;
    } catch (error) {
        log.warn(`READ taxonomy CSV at ${filePath} FAILED with\n`, error?.message);
    }
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
ipcMain.on('submit-form-response', submitFormResponse);
ipcMain.on('fetch-form-definition', fetchFormDefinition);
ipcMain.on('fetch-form-choices', fetchFormChoices);
ipcMain.on('fetch-list-definition', fetchListDefinition);
ipcMain.on('submitted-form-definition', fetchFormListDefinition);
ipcMain.on('fetch-list-followup', fetchFollowupFormData);
ipcMain.on('fetch-filter-dataset', fetchFilterDataset);
ipcMain.on('fetch-username', fetchUsername);
ipcMain.on('export-xlsx', exportExcel);
ipcMain.on('delete-instance', deleteData);
ipcMain.on('form-details', fetchFormDetails);
ipcMain.on('user-db-info', getUserDBInfo);

// refactored & new
ipcMain.handle('sign-in', signIn); // still uses BAHIS 2 for Auth
ipcMain.handle('request-app-data-sync', getAppData); // still both BAHIS 2 and BAHIS 3
ipcMain.on('request-user-data-sync', postGetUserData); // still both BAHIS 2 and BAHIS 3
ipcMain.handle('refresh-database', refreshDatabase); // still both BAHIS 2 and BAHIS 3 tables

ipcMain.handle('get-local-db', getLocalDB);
ipcMain.handle('post-local-db', postLocalDB);
ipcMain.handle('request-module-sync', getModules);
ipcMain.handle('request-workflow-sync', getWorkflows);
ipcMain.handle('request-form-sync', getForms);
ipcMain.handle('request-taxonomy-sync', getTaxonomies);
ipcMain.handle('request-administrative-region-sync', getAdministrativeRegions);
ipcMain.handle('read-taxonomy-data', readTaxonomy);
