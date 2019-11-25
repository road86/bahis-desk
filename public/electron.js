// eslint-disable-next-line import/no-extraneous-dependencies
const electron = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const os = require('os');
const fs = require('fs');

const { app, BrowserWindow, ipcMain } = electron;
const DB_NAME = 'foobar.db';
let mainWindow;

// DEV EXTENSIONS

// extension paths
const REACT_EXTENSION_PATH =
  '/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.2.0_0';
const REDUX_EXTENSION_PATH =
  '/.config/google-chrome/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0';

/** add the react and redux devtools to electron */
function addDevToolsExt() {
  BrowserWindow.addDevToolsExtension(path.join(os.homedir(), REACT_EXTENSION_PATH));
  BrowserWindow.addDevToolsExtension(path.join(os.homedir(), REDUX_EXTENSION_PATH));
}

// App

// DB utils

/** sets up new databse. Creates tables that are required */
function setUpNewDB() {
  const db = new Database(DB_NAME);
  const setUpQueries = fs.readFileSync('set-up-queries.sql', 'utf8');
  db.exec(setUpQueries);
  db.close();
}

/** set up new db if not exists */
function prepareDb() {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    db.close();
  } catch (err) {
    setUpNewDB();
    // eslint-disable-next-line no-console
    console.log('Database Setup!!!!');
  }
}

// processes

/** creates the db and sets up the window in electron */
function createWindow() {
  // comment next line if react and redux dev extensions not installed
  addDevToolsExt();
  prepareDb();
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL(
    isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`
  );
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// types of App states
const APP_READY_STATE = 'ready';
const APP_CLOSE_STATE = 'window-all-closed';
const APP_ACTIVATE_STATE = 'activate';

// subscribes the App states with related processes

/** creates window on app ready */
app.on(APP_READY_STATE, createWindow);

/** removes window on app close */
app.on(APP_CLOSE_STATE, () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/** adds window on app if window null */
app.on(APP_ACTIVATE_STATE, () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Endpoint processes

// types of channels
const APP_DEFINITION_CHANNEL = 'fetch-app-definition';
const FORM_SUBMISSION_CHANNEL = 'submit-form-response';
const FORM_DEFINITION_CHANNEL = 'fetch-form-definition';
const LIST_DEFINITION_CHANNEL = 'fetch-list-definition';

// listeners

/** fetches the app menu definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns - the app definition json
 */
const fetchAppDefinition = event => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    // eslint-disable-next-line no-param-reassign
    event.returnValue = db.prepare('SELECT definition from app limit 1').get().definition;
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

/** saves the form response to db
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {Object} response - an object containing formId and data (user's response)
 */
const submitFormResponse = (event, response) => {
  // eslint-disable-next-line no-console
  console.log('data', response);
  const db = new Database(DB_NAME, { fileMustExist: true });
  const insert = db.prepare('INSERT INTO data (form_id, data) VALUES (@formId, @data)');
  insert.run(response);
  db.close();
};

/** fetches the form definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} formId- the form id
 * @returns - the definition of form respective to form id
 */
const fetchFormDefinition = (event, formId) => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    // eslint-disable-next-line no-param-reassign
    event.returnValue = db
      .prepare('SELECT definition from forms where form_id = ? limit 1')
      .get(formId).definition;
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

/** fetches the list definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} listId- the list id
 * @returns - the definition of list respective to list id
 */
const fetchListDefinition = (event, listId) => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const fetchedRows = db
      .prepare('SELECT filter_definition, table_definition from lists where list_id = ? limit 1')
      .get(listId);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = {
      filterDefinition: fetchedRows.filter_definition,
      tableDefinition: fetchedRows.table_definition,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

// subscribes the listeners to channels
ipcMain.on(APP_DEFINITION_CHANNEL, fetchAppDefinition);
ipcMain.on(FORM_SUBMISSION_CHANNEL, submitFormResponse);
ipcMain.on(FORM_DEFINITION_CHANNEL, fetchFormDefinition);
ipcMain.on(LIST_DEFINITION_CHANNEL, fetchListDefinition);
