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
const SUBMISSION_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/submission/`;
// DEV EXTENSIONS

// extension paths
const REACT_EXTENSION_PATH =
  '/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.4.0_0';
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
  mainWindow.maximize();
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

/** Replaces invalid xml entries with special xml entries
 * @param {string} affectedString - the string containing invalid xml invalid entries
 * @returns {string} - the modified string with no invalid xml entries
 */
const handleXmlInvalidEntries = affectedString => {
  let tmpString = affectedString;
  tmpString = tmpString.replace('&', '&amp;');
  tmpString = tmpString.replace('<', '&lt;');
  tmpString = tmpString.replace('>', '&gt;');
  return tmpString;
};

/** transforms individual json key, value to xml attribute based on json value type
 * @param {string} xkey - json key
 * @param {any} xvalue - json value
 * @returns {string} - the transformed xml value
 */
const generateIndividualXml = (xkey, xvalue) => {
  let tmp = '';
  if (xvalue !== null && xvalue !== undefined) {
    if (Array.isArray(xvalue)) {
      if (xvalue.length > 0) {
        if (xvalue[0].constructor.name === 'Object') {
          xvalue.forEach(tmpValue => {
            tmp += generateIndividualXml(xkey, tmpValue);
          });
        } else if (xvalue[0].constructor.name === 'Date') {
          tmp += `<${xkey}>`;
          xvalue.forEach(tmpValue => {
            tmp += `${tmpValue} `;
          });
          tmp += `</${xkey}>`;
        } else {
          tmp += `<${xkey}>`;
          xvalue.forEach(tmpValue => {
            tmp += `${
              typeof tmpValue === 'string' ? handleXmlInvalidEntries(tmpValue) : tmpValue
            } `;
          });
          tmp += `</${xkey}>`;
        }
      }
    } else if (xvalue.constructor.name === 'Object') {
      if (Object.keys(xvalue).length !== 0) {
        tmp += `<${xkey}>`;
        Object.keys(xvalue).forEach(tmpKey => {
          tmp += generateIndividualXml(tmpKey, xvalue[tmpKey]);
        });
        tmp += `</${xkey}>`;
      }
    } else if (xvalue.constructor.name === 'Date') {
      tmp += `<${xkey}>`;
      tmp += xvalue.toISOString();
      tmp += `</${xkey}>`;
    } else {
      tmp += `<${xkey}>`;
      tmp += typeof xvalue === 'string' ? handleXmlInvalidEntries(xvalue) : xvalue;
      tmp += `</${xkey}>`;
    }
  }
  return tmp;
};

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
        // eslint-disable-next-line no-param-reassign
        mJsnObj[xPath[index]] = [];
      }
      xvalue.forEach((xvalueItem, xItemindex) => {
        Object.keys(xvalueItem).forEach(jsnKey => {
          const jsnPath = jsnKey.split('/');
          if (!mJsnObj[xPath[index]][xItemindex]) {
            // eslint-disable-next-line no-param-reassign
            mJsnObj[xPath[index]][xItemindex] = {};
          }
          assignJsnValue(mJsnObj[xPath[index]][xItemindex], jsnPath, index + 1, xvalueItem[jsnKey]);
        });
      });
    } else {
      // eslint-disable-next-line no-param-reassign
      mJsnObj[xPath[index]] = xvalue;
    }
    return;
  }
  if (!(xPath[index] in mJsnObj)) {
    // eslint-disable-next-line no-param-reassign
    mJsnObj[xPath[index]] = {};
    assignJsnValue(mJsnObj[xPath[index]], xPath, index + 1, xvalue);
  } else {
    assignJsnValue(mJsnObj[xPath[index]], xPath, index + 1, xvalue);
  }
};

/** converts json object to xml text
 * @param {Object} jsnObj - the user input json object
 * @param {string} formIdString - the form unique name
 * @returns {string} - the odk format xml string
 */
const convertJsonToXml = (jsnObj, formIdString) => {
  const modifiedJsnObj = {};
  Object.keys(jsnObj).forEach(jsnKey => {
    const jsnPath = jsnKey.split('/');
    assignJsnValue(modifiedJsnObj, jsnPath, 0, jsnObj[jsnKey]);
  });
  let xmlString = "<?xml version='1.0'?>";
  xmlString += `<${formIdString} id="${formIdString}">`;
  Object.keys(modifiedJsnObj).forEach(mkey => {
    xmlString += generateIndividualXml(mkey, modifiedJsnObj[mkey]);
  });
  xmlString += `</${formIdString}>`;
  return xmlString;
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
const DATA_SYNC_CHANNEL = 'request-data-sync';
const FILTER_DATASET_CHANNEL = 'fetch-filter-dataset';

// listeners

/** fetches the filter dataset needed to render single select and multiple select options
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} listId - the list id of the lists table
 * @param {string[]} filterColumns - the list of columns needed in the dataset
 * @returns {Object[]} - the filter dataset containing unique combinations of columns
 */
const fetchFilterDataset = (event, listId, filterColumns) => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const listDefinition = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId);
    const datasource = JSON.parse(listDefinition.datasource);
    const datasourceQuery =
      datasource.type === '0' ? `select * from ${datasource.query}` : datasource.query;
    const randomTableName = `tab${Math.random()
      .toString(36)
      .substring(2, 12)}`;
    const filterDatasetQuery = db.prepare(
      `with ${randomTableName} as (${datasourceQuery}) select ${filterColumns.toString()} from ${randomTableName} group by ${filterColumns.toString()}`
    );
    const returnedRows = filterDatasetQuery.all();
    // eslint-disable-next-line no-param-reassign
    event.returnValue = returnedRows;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = [];
  }
};

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
  const insert = db.prepare('INSERT INTO data (form_id, data, status) VALUES (@formId, @data, 0)');
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
      try {
        const { query } = choiceDefinition[key];
        choices[key] = db.prepare(query).all();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
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
            const layoutDeleteQuery = db.prepare('DELETE FROM app WHERE app_id = 1');
            try {
              layoutDeleteQuery.run();
            } catch (err) {
              // eslint-disable-next-line no-console
              console.log('Previous Layout does not exist');
            }
            const newLayoutQuery = db.prepare(
              'INSERT INTO app(app_id, app_name, definition) VALUES(1, ?,?)'
            );
            newLayoutQuery.run('Bahis', JSON.stringify(moduleListRes.data));
          }
          if (formListRes.data) {
            const previousFormDeletionQuery = db.prepare('DELETE FROM forms WHERE form_id = ?');
            const newFormInsertionQuery = db.prepare(
              'INSERT INTO forms(form_id, form_name, definition, choice_definition, form_uuid) VALUES(?,?,?,?,?)'
            );
            formListRes.data.forEach(formObj => {
              try {
                previousFormDeletionQuery.run(formObj.id);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.log('Deletion Failed ! Previous form not exists!!');
              }
              try {
                newFormInsertionQuery.run(
                  formObj.id,
                  formObj.name,
                  JSON.stringify(formObj.form_definition),
                  JSON.stringify(formObj.choice_list),
                  formObj.form_uuid
                );
              } catch (err) {
                // eslint-disable-next-line no-console
                console.log('db form insertion failed !!!', err);
              }
            });
            if (listRes.data) {
              const previousListDeletionQuery = db.prepare('DELETE FROM lists WHERE list_id = ?');
              const newListInsertQuery = db.prepare(
                'INSERT INTO lists(list_id, list_name, list_header, datasource, filter_definition, column_definition) VALUES(?,?,?,?,?,?)'
              );
              listRes.data.forEach(listObj => {
                try {
                  previousListDeletionQuery.run(listObj.id);
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.log('Deletion Failed ! Previous list not exists!!');
                }
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
      )
      .catch(err => {
        // eslint-disable-next-line no-console
        console.log('Axios FAILED', err);
      });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

/** starts data sync on request event
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns {string} - success when completes; otherwise, failed if error occurs
 */
const requestDataSync = async event => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const notSyncRowsQuery = db.prepare('Select * from data where status = 0');
    const updateStatusQuery = db.prepare('UPDATE data SET status = 1 WHERE data_id = ?');
    try {
      const notSyncRows = notSyncRowsQuery.all() || [];
      await notSyncRows.forEach(async rowObj => {
        const formDefinitionObj = db
          .prepare('Select * from forms where form_id = ?')
          .get(rowObj.form_id);
        // eslint-disable-next-line no-unused-vars
        let formData = JSON.parse(rowObj.data) || {};
        formData = { ...formData, 'formhub/uuid': formDefinitionObj.form_uuid };
        const apiFormData = {
          xml_submission_file: convertJsonToXml(formData, formDefinitionObj.form_name),
          test_file: fs.readFileSync('set-up-queries.sql', 'utf8'),
        };
        await axios
          .post(SUBMISSION_ENDPOINT, JSON.stringify(apiFormData), {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': '*',
              'Content-Type': 'application/json',
            },
          })
          .then(response => {
            if (response.data.status === 201) {
              updateStatusQuery.run(rowObj.data_id);
            }
          })
          .catch(error => {
            // eslint-disable-next-line no-console
            console.log(error);
          });
      });
      // eslint-disable-next-line no-param-reassign
      event.returnValue = 'success';
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = 'failed';
  }
};

// subscribes the listeners to channels
ipcMain.on(APP_DEFINITION_CHANNEL, fetchAppDefinition);
ipcMain.on(FORM_SUBMISSION_CHANNEL, submitFormResponse);
ipcMain.on(FORM_DEFINITION_CHANNEL, fetchFormDefinition);
ipcMain.on(LIST_DEFINITION_CHANNEL, fetchListDefinition);
ipcMain.on(QUERY_DATA_CHANNEL, fetchQueryData);
ipcMain.on(START_APP_CHANNEL, startAppSync);
ipcMain.on(DATA_SYNC_CHANNEL, requestDataSync);
ipcMain.on(FILTER_DATASET_CHANNEL, fetchFilterDataset);
