// eslint-disable-next-line import/no-extraneous-dependencies
//imports 
const electron = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const os = require('os');
const axios = require('axios');
const { dialog } = require('electron')
var macaddress = require('macaddress');
const { autoUpdater } = require('electron-updater');
const { fetchDataFromServer, sendDataToServer, parseAndSaveToFlatTables, queries } = require('./modules/syncFunctions');


// SERVER URLS
// const SERVER_URL = 'http://bahis.dynamic.mpower-social.com:8999';
// const SERVER_URL = 'http://192.168.19.16:8009';
const SERVER_URL = 'http://192.168.19.16:8043';
// TODO Need to update /0/ at the end of DB_TABLES_ENDPOINT DYNAMICALLY
const DB_TABLES_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get/form-config/?/`;
const APP_DEFINITION_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/module-list/`;
const FORMS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/form-list/`;
const LISTS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/list-def/`;
const SIGN_IN_ENDPOINT = `${SERVER_URL}/bhmodule/app-user-verify/`;
const GEOLOC_ENDPOINT = `${SERVER_URL}//bhmodule/catchment-data-sync/`;

// DEV EXTENSIONS

// extension paths
const REACT_EXTENSION_PATH =
  '/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.8.2_0';
const REDUX_EXTENSION_PATH =
  '/.config/google-chrome/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0';


// types of App states
const APP_READY_STATE = 'ready';
const APP_CLOSE_STATE = 'window-all-closed';
const APP_ACTIVATE_STATE = 'activate';
// types of channels
const APP_DEFINITION_CHANNEL = 'fetch-app-definition';
const FORM_SUBMISSION_CHANNEL = 'submit-form-response';
const FORM_DEFINITION_CHANNEL = 'fetch-form-definition';
const LIST_DEFINITION_CHANNEL = 'fetch-list-definition';
const QUERY_DATA_CHANNEL = 'fetch-query-data';
const START_APP_CHANNEL = 'start-app-sync';
const DATA_SYNC_CHANNEL = 'request-data-sync';
const FILTER_DATASET_CHANNEL = 'fetch-filter-dataset';
const APP_RESTART_CHANNEL = 'request-app-restart';
const SIGN_IN = 'sign-in';
const WRITE_GEO_OBJECT = 'write-geo-object';
const FETCH_DISTRICT = 'fetch-district';
const FETCH_DIVISION = 'fetch-division';
const FETCH_UPAZILA = 'fetch-upazila';
const FETCH_USERNAME = 'fetch-username';
const AUTO_UPDATE = 'auto-update';

const { app, BrowserWindow, ipcMain } = electron;
const DB_NAME = 'foobar.db';
let mainWindow;

// App/** creates window on app ready */
app.on(APP_READY_STATE, createWindow);

/** adds window on app if window null */
app.on(APP_ACTIVATE_STATE, () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/** creates the db and sets up the window in electron */
function createWindow() {
  // comment next line if react and redux dev extensions not installed
  if (isDev) {
    // addDevToolsExt();
  }
  console.log("create windo ");
  prepareDb();
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    icon: `${__dirname}/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });
  mainWindow.maximize();
  // mainWindow.setBackgroundColor('#FF0000');
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.loadURL(
    isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`
  );
  // autoUpdater.checkForUpdates();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// DB utils

/** sets up new databse. Creates tables that are required */
function setUpNewDB() {
  const db = new Database(DB_NAME);
  console.log('new db setup call');
  db.exec(queries);
  db.close();
}

// subscribes the App states with related processes

/** removes window on app close */
app.on(APP_CLOSE_STATE, () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


function sendStatusToWindow(text) {
  mainWindow.send(text, text);
}

autoUpdater.autoDownload = false

autoUpdater.on('error', (error) => {
  dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('update-available', () => {
  sendStatusToWindow('update_available');
  dialog.showMessageBox({
    type: 'info',
    title: 'Found Updates',
    message: 'Found updates, do you want update now?',
    buttons: ['Sure', 'No']
  }, (buttonIndex) => {
    if (buttonIndex === 0) {
      console.log('check downloading');
      sendStatusToWindow('update-downloading');
      autoUpdater.downloadUpdate();
    }
    // else {
    //   updater.enabled = true
    //   updater = null
    // }
  })
})

autoUpdater.on('update-not-available', () => {
  sendStatusToWindow('update_not_available');
  dialog.showMessageBox({
    title: 'No Updates',
    message: 'Current version is up-to-date.'
  })
  // updater.enabled = true
  // updater = null
})

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('update_downloaded');
  dialog.showMessageBox({
    title: 'Install Updates',
    message: 'Updates downloaded, application will be quit for update...'
  }, () => {
    setImmediate(() => autoUpdater.quitAndInstall())
  })
})

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('checking_for_update...');
})

/** add the react and redux devtools to electron */
function addDevToolsExt() {
  BrowserWindow.addDevToolsExtension(path.join(os.homedir(), REACT_EXTENSION_PATH));
  BrowserWindow.addDevToolsExtension(path.join(os.homedir(), REDUX_EXTENSION_PATH));
}

// utils
const parseFieldNames = (parentName, possibleNames, currentFormJsn) => {
  currentFormJsn.forEach(currentElem => {
    switch (currentElem.type) {
      case 'group':
      case 'repeat':
        // eslint-disable-next-line no-param-reassign
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
        // eslint-disable-next-line no-param-reassign
        possibleNames.push(parentName + currentElem.name);
        break;
      default:
        break;
    }
  });
};

const extractPossibleFieldNames = xformJsn => {
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
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const listDefinition = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId);
    // console.log(listDefinition);
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
    console.log('definition', event.returnValue);
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
  console.log('data', response, JSON.parse(response.data)['meta/instanceID']);
  const db = new Database(DB_NAME, { fileMustExist: true });
  const insert = db.prepare(
    'INSERT INTO data (form_id, data, status, instanceid) VALUES (@formId, @data, 0, ?)'
  );
  insert.run(response, response.data ? JSON.parse(response.data)['meta/instanceID'] : '');
  parseAndSaveToFlatTables(db, response.formId, response.data, null);
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
        choices[`${key}.csv`] = db.prepare(query).all();
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
    console.log(queryString);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = fetchedRows;
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

// eslint-disable-next-line no-unused-vars
const signIn = async (event, userData) => {
  let mac;
  macaddress.one(function (err, mac) {
    mac = mac;
    console.log(mac);
  });
  const db = new Database(DB_NAME, { fileMustExist: true });
  const query = 'SELECT user_id from users where username="' + userData.username + '" AND password="' + userData.password + '" AND upazila="' + userData.upazila + '"';
  const userInfo = db.prepare(query).get();
  // const info = userInfo.user_id;
  console.log('user input', userInfo);
  if (userInfo == undefined) {
    const data = {
      'username': userData.username,
      'password': userData.password,
      'mac_address': mac,
      'upazila': userData.upazila,
    };
    // console.log(data);
    await axios
      .post(SIGN_IN_ENDPOINT, JSON.stringify(data), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
        },
      })
      .then(response => {
        // console.log(response);
        if (!(Object.keys(response.data).length === 0 && response.data.constructor === Object)) {
          // if (response.status == 200 || response.status == 201) {
          console.log('successfull', userData);
          const insertStmt = db.prepare(
            `INSERT INTO users (username, password, macaddress, upazila, lastlogin, name, role, organization, branch, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          );
          const data = response.data;
          insertStmt.run(userData.username, userData.password, mac, userData.upazila, Math.round((new Date()).getTime()), data.name, data.role, data.organization, data.branch, data.email);
          results = {username: data.user_name, message: ""}
          // event.sender.send('formSubmissionResults', results);
          mainWindow.send('formSubmissionResults', results);
          // event.returnValue = {
          //   userInfo: data,
          //   // message: ""
          // };
        } else if (response.status == 409) {
          results = {
            message: "Un-authenticated User",
            username: "",
          }
          mainWindow.send('formSubmissionResults', results);
        }
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        results = {
          message: "Un-authenticated User",
          username: "",
        }
        mainWindow.send('formSubmissionResults', results);
      });
  } else {
    // const updateUserQuery = db.prepare(
    //   'UPDATE users SET lastlogin = ? WHERE user_id = ?'
    // );
    // const dateTime = (new Date()).toString()
    // updateUserQuery.run( dateTime, userInfo);
    results = {
      message: "",
      username: userData.username,
    }
    mainWindow.send('formSubmissionResults', results);
  }
  db.close();
};

const popuplateGeoTable = (event, geoList) => {
  const db = new Database(DB_NAME, { fileMustExist: true });
  const geoData = geoList ? geoList['catchment-area.csv'] : []
  // console.log('call', geoData);
  if (geoData.length) {
    const insertStmt = db.prepare(
      `INSERT INTO geo (div_id, division, dis_id, district, upz_id, upazila) VALUES (@div_id, @division, @dis_id, @district, @upz_id, @upazila)`
    );

    const insertMany = db.transaction((geos) => {
      // console.log(geos);
      for (const geo of geos) insertStmt.run({
        div_id: geo.division, division: geo.division_label, dis_id: geo.district, district: geo.dist_label, upz_id: geo.upazila, upazila: geo.upazila_label
      });
    });

    insertMany(geoData);
    // geoData.forEach(response => {
    //   const insertStmt = db.prepare(
    //     `INSERT INTO geo (div_id, division, dis_id, district, upz_id, upazila) VALUES (?, ?, ?, ?, ?, ?)`
    //   );
    //   insertStmt.run(response.division, response.division_label, response.district, response.dist_label, response.upazila, response.upazila_label);
    // });
  }
  db.close();
};

const fetchUsername = (event) => {
  console.log('check call');
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const fetchedUsername = db.prepare('SELECT username from users order by lastlogin desc limit 1').get();
    // eslint-disable-next-line no-param-reassign
    console.log(fetchedUsername);
    event.returnValue = {
      username: fetchedUsername.username,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    // db.close();
  }
};


const fetchDivision = (event) => {
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const fetchedRows = db.prepare('SELECT DISTINCT	div_id, division FROM geo').all();
    // eslint-disable-next-line no-param-reassign
    console.log(fetchedRows);
    event.returnValue = {
      division: fetchedRows,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    db.close();
  }
};

const fetchUpazila = (event, divisionId, districtId) => {
  console.log(divisionId, districtId)
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const query = 'SELECT DISTINCT upz_id, upazila FROM geo WHERE div_id = "' + divisionId + '" AND dis_id = "' + districtId + '"';
    const fetchedRows = db.prepare(query).all();
    event.returnValue = {
      upazila: fetchedRows,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    db.close();
  }
};

const fetchDistrict = (event, divisionId) => {
  // console.log(divisionId);
  try {
    const db = new Database(DB_NAME, { fileMustExist: true });
    const query = 'SELECT DISTINCT dis_id, district FROM geo WHERE div_id = "' + divisionId + '"';
    const fetchedRows = db.prepare(query).all();
    // eslint-disable-next-line no-param-reassign
    // console.log(fetchedRows, query);
    event.returnValue = {
      district: fetchedRows,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    db.close();
  }
};

/** sync and updates app on start up
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns - success if sync successful
 */

const getDBTablesEndpoint =(db)=> {
  const log = db.prepare('SELECT * from app_log order by time desc limit 1').get();
  const time = log === undefined ? 0 : Math.round(log.time);
  const db_endpoint_url = DB_TABLES_ENDPOINT.replace('?', time);
  console.log(db_endpoint_url);
  return db_endpoint_url;
}


const startAppSync = (event, name) => {
  try {
    console.log('name', name);
    const db = new Database(DB_NAME, { fileMustExist: true });
    axios
      .all([
        axios.get(getDBTablesEndpoint(db).replace("core_admin", name)),
        axios.get(APP_DEFINITION_ENDPOINT.replace("core_admin", name)),
        axios.get(FORMS_ENDPOINT.replace("core_admin", name)),
        axios.get(LISTS_ENDPOINT.replace("core_admin", name)),
      ])
      .then(
        axios.spread((formConfigRes, moduleListRes, formListRes, listRes) => {
          // console.log(formConfigRes, moduleListRes);
          let message = "done";
          mainWindow.send('formSyncComplete', message);
          if (formConfigRes.data) {
            if(formConfigRes.data.length > 0) {
              const newLayoutQuery = db.prepare(
                'INSERT INTO app_log(time) VALUES(?)'
              );
              newLayoutQuery.run(formConfigRes.data[0].updated_at);
              // db.prepare('INSERT INTO app_log(time) VALUES(?)').run(formConfigRes.data[0]);
              // addAppLog(db, formConfigRes.data[0]);
              console.log("app log data --> ", db.prepare('SELECT * from app_log order by time desc limit 1').get());
            }

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
              'INSERT INTO forms(form_id, form_name, definition, choice_definition, form_uuid, table_mapping, field_names) VALUES(?,?,?,?,?,?,?)'
            );
            formListRes.data.forEach(async formObj => {
              try {
                previousFormDeletionQuery.run(formObj.id);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.log('Deletion Failed ! Previous form not exists!!');
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
                  JSON.stringify(fieldNames)
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
          // let message = "done";
          // mainWindow.send('formSyncComplete', message);
          db.close();
        })
      )
      .catch(err => {
        let message = "nope";
        mainWindow.send('formSyncComplete', message);
        // eslint-disable-next-line no-console
        console.log('Axios FAILED', err);
      });
  } catch (err) {
    console.log('try catch', err)
    let message = "nope";
    mainWindow.send('formSyncComplete', message);
    // eslint-disable-next-line no-console
    // console.log(err);
  }
};

/** starts data sync on request event
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns {string} - success when completes; otherwise, failed if error occurs
 */
const requestDataSync = async (event, username) => {
  await fetchDataFromServer(username);
  const msg = await sendDataToServer(username);
  mainWindow.send('dataSyncComplete', msg);
  event.returnValue = msg;
};

/** restarts the app
 * @param {IpcMainEvent} _event - the default ipc main event
 */
// eslint-disable-next-line no-unused-vars
const requestRestartApp = async _event => {
  app.relaunch();
  app.exit();
};

const autoUpdate = (event) => {
  console.log('check update call');
  autoUpdater.checkForUpdates();
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
ipcMain.on(APP_RESTART_CHANNEL, requestRestartApp);
ipcMain.on(SIGN_IN, signIn);
ipcMain.on(WRITE_GEO_OBJECT, popuplateGeoTable);
ipcMain.on(FETCH_DIVISION, fetchDivision);
ipcMain.on(FETCH_DISTRICT, fetchDistrict);
ipcMain.on(FETCH_UPAZILA, fetchUpazila);
ipcMain.on(FETCH_USERNAME, fetchUsername);
ipcMain.on(AUTO_UPDATE, autoUpdate);

