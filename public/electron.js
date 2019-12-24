// eslint-disable-next-line import/no-extraneous-dependencies
const electron = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const os = require('os');
const fs = require('fs');
const axios = require('axios');

const { app, BrowserWindow, ipcMain } = electron;
const DB_NAME = 'foobar.db';
let mainWindow;

// SERVER URLS
const SERVER_URL = 'http://192.168.19.16:8009';
const DB_TABLES_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get/form-config/`;
const APP_DEFINITION_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/module-list/`;
const FORMS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/form-list/`;
const LISTS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/list-def/`;

// DEV EXTENSIONS

// extension paths
const REACT_EXTENSION_PATH =
  '/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.2.1_0';
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
  if (isDev) {
    addDevToolsExt();
  }
  prepareDb();
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
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

// utils
/** checks the array of strings i.e. value not from repeat but from select multiple
 * @param {Array} testArray - the array to check if object presents
 * @returns {Boolean} - true if array not of string; otherwise, false
 */
const isNotArrayOfString = testArray => {
  let isObjectFound = false;
  testArray.forEach(arrElm => {
    if (typeof arrElm === 'object') {
      isObjectFound = true;
    }
  });
  return isObjectFound;
};

/** recursively generates insert query and saves to flat table
 * @param {any} dbCon - the better sqlite3 database query
 * @param {Text} tableName - the table name to be inserted
 * @param {Text} parentTableName - the parent table name if exists
 * @param {Object} tableObj - the tableObj containing table values needed to be stored
 * @param {Text} instanceId - the meta instance id generated with each response
 * @param {Number} parentId - the parent id needed to reference in sub repeat tables
 */
const objToTable = (dbCon, tableName, parentTableName, tableObj, instanceId, parentId) => {
  let columnNames = '';
  let fieldValues = '';
  const repeatKeys = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const key in tableObj) {
    if (
      Array.isArray(tableObj[key]) &&
      tableObj[key].length > 0 &&
      isNotArrayOfString(tableObj[key])
    ) {
      repeatKeys.push(key);
    } else {
      columnNames = `${columnNames + key.replace('/', '_')}, `;
      fieldValues = `${fieldValues}"${tableObj[key]}", `;
    }
  }
  let newParentId = null;
  if (columnNames !== '' || repeatKeys.length > 0) {
    if (instanceId) {
      columnNames += 'instanceid, ';
      fieldValues += `"${instanceId}", `;
    }
    if (parentId) {
      columnNames += `${parentTableName}_id, `;
      fieldValues += `"${parentId}", `;
    }
    const query = `INSERT INTO ${tableName}_table (${columnNames.substr(
      0,
      columnNames.length - 2
    )}) VALUES (${fieldValues.substr(0, fieldValues.length - 2)})`;
    try {
      const successfulInsert = dbCon.prepare(query).run();
      newParentId = successfulInsert.lastInsertRowid;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Insert failed !!!', err, query);
    }
  }
  repeatKeys.forEach(key => {
    tableObj[key].forEach(elm => {
      objToTable(
        dbCon,
        `${tableName}_${key.replace('/', '_')}`,
        tableName,
        elm,
        instanceId,
        newParentId
      );
    });
  });
};

/** parses and saves the user response to flat tables
 * @param {any} dbConnection - the better sqlite 3 db connection
 * @param {Number} formId - the formId of the form that is filled out
 * @param {Object} userInput - the user response object following odk format
 */
const parseAndSaveToFlatTables = (dbConnection, formId, userInput) => {
  const formDefinition = JSON.parse(
    dbConnection.prepare('SELECT definition from forms where form_id = ? limit 1').get(formId)
      .definition
  );
  const userInputObj = JSON.parse(userInput);
  objToTable(
    dbConnection,
    `bahis_${formDefinition.id_string}`,
    '',
    userInputObj,
    userInputObj['meta/instanceID']
  );
};

// types of channels
const APP_DEFINITION_CHANNEL = 'fetch-app-definition';
const FORM_SUBMISSION_CHANNEL = 'submit-form-response';
const FORM_DEFINITION_CHANNEL = 'fetch-form-definition';
const LIST_DEFINITION_CHANNEL = 'fetch-list-definition';
const QUERY_DATA_CHANNEL = 'fetch-query-data';
const START_APP_CHANNEL = 'start-app-sync';

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
  parseAndSaveToFlatTables(db, response.formId, response.data);
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
    const formDefinitionObj = db
      .prepare('SELECT * from forms where form_id = ? limit 1')
      .get(formId);
    const choiceDefinition = formDefinitionObj.choice_definition
      ? JSON.parse(formDefinitionObj.choice_definition)
      : {};
    const choices = {};
    Object.keys(choiceDefinition).forEach(key => {
      const { query } = choiceDefinition[key];
      choices[key] = db.prepare(query).all();
    });
    // eslint-disable-next-line no-param-reassign
    event.returnValue = { ...formDefinitionObj, formChoices: JSON.stringify(choices) };
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
    const fetchedRows = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = {
      filterDefinition: fetchedRows.filter_definition,
      columnDefinition: fetchedRows.column_definition,
      datasource: fetchedRows.datasource,
      listName: fetchedRows.list_name,
      listHeader: fetchedRows.list_header,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

/** fetches the data based on query
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} queryString- the query string
 * @returns - the returned dataset from the query
 */
const fetchQueryData = (event, queryString) => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const fetchedRows = db.prepare(queryString).all();
    // eslint-disable-next-line no-param-reassign
    event.returnValue = fetchedRows;
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

/** sync and updates app on start up
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns - success if sync successful
 */
const startAppSync = event => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    // const fetchedRows = db.prepare(queryString).all();
    axios
      .all([
        axios.get(DB_TABLES_ENDPOINT),
        axios.get(APP_DEFINITION_ENDPOINT),
        axios.get(FORMS_ENDPOINT),
        axios.get(LISTS_ENDPOINT),
      ])
      .then(
        axios.spread((formConfigRes, moduleListRes, formListRes, listRes) => {
          if (formConfigRes.data) {
            formConfigRes.data.forEach(sqlObj => {
              try {
                db.exec(sqlObj.sql_script);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.log('db data table creation failed !!!', err);
              }
            });
          }
          if (moduleListRes.data) {
            const newLayoutQuery = db.prepare('INSERT INTO app(app_name, definition) VALUES(?,?)');
            newLayoutQuery.run('Bahis', JSON.stringify(moduleListRes.data));
          }
          if (formListRes.data) {
            const newFormInsertionQuery = db.prepare(
              'INSERT INTO forms(form_id, form_name, definition, choice_definition) VALUES(?,?,?,?)'
            );
            formListRes.data.forEach(formObj => {
              try {
                newFormInsertionQuery.run(
                  formObj.id,
                  formObj.name,
                  JSON.stringify(formObj.form_definition),
                  JSON.stringify(formObj.choice_list)
                );
              } catch (err) {
                // eslint-disable-next-line no-console
                console.log('db form insertion failed !!!', err);
              }
            });
            if (listRes.data) {
              const newListInsertQuery = db.prepare(
                'INSERT INTO lists(list_id, list_name, list_header, datasource, filter_definition, column_definition) VALUES(?,?,?,?,?,?)'
              );
              listRes.data.forEach(listObj => {
                try {
                  newListInsertQuery.run(
                    listObj.id,
                    listObj.list_name,
                    JSON.stringify(listObj.list_header),
                    JSON.stringify(listObj.datasource),
                    JSON.stringify(listObj.filter_definition),
                    JSON.stringify(listObj.column_definition)
                  );
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.log('db list insertion failed', err);
                }
              });
            }
          }
          // eslint-disable-next-line no-param-reassign
          event.returnValue = 'done';
          db.close();
        })
      );
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
ipcMain.on(QUERY_DATA_CHANNEL, fetchQueryData);
ipcMain.on(START_APP_CHANNEL, startAppSync);
