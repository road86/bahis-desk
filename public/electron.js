// eslint-disable-next-line import/no-extraneous-dependencies
//imports
const electron = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const os = require('os');
const axios = require('axios');
const { dialog } = require('electron');
var macaddress = require('macaddress');
const { autoUpdater } = require('electron-updater');
const { random } = require ('lodash');
const download = require('image-downloader');
const fs = require('fs');
const { fetchDataFromServer, sendDataToServer, parseAndSaveToFlatTables,deleteDataWithInstanceId, fetchCsvDataFromServer, queries} = require('./modules/syncFunctions');
const firstRun = require('electron-first-run');
const DB = require('better-sqlite3-helper');
const fsExtra = require('fs-extra')
const { SERVER_URL, DB_TABLES_ENDPOINT, APP_DEFINITION_ENDPOINT, FORMS_ENDPOINT, LISTS_ENDPOINT, SIGN_IN_ENDPOINT, FORM_CHOICE_ENDPOINT } = require('./constants');


// DEV EXTENSIONS

// extension paths
const REACT_EXTENSION_PATH = '/.config/google-chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.8.2_0';
const REDUX_EXTENSION_PATH = '/.config/google-chrome/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0';

// types of App states
const APP_READY_STATE = 'ready';
const APP_CLOSE_STATE = 'window-all-closed';
const APP_ACTIVATE_STATE = 'activate';

const cmd = process.argv[1];

// types of channels
const APP_DEFINITION_CHANNEL = 'fetch-app-definition';
const FORM_SUBMISSION_CHANNEL = 'submit-form-response';
const FORM_DEFINITION_CHANNEL = 'fetch-form-definition';
const FORM_CHOICES_CHANNEL = 'fetch-form-choices';
const LIST_DEFINITION_CHANNEL = 'fetch-list-definition';
const SUBMITTED_FORM_DEFINITION_CHANNEL = 'submitted-form-definition'
const FETCH_LIST_FOLLOWUP = 'fetch-list-followup'
const QUERY_DATA_CHANNEL = 'fetch-query-data';
const START_APP_CHANNEL = 'start-app-sync';
const DATA_SYNC_CHANNEL = 'request-data-sync';
const CSV_DATA_SYNC_CHANNEL = 'csv-data-sync';
const FILTER_DATASET_CHANNEL = 'fetch-filter-dataset';
const APP_RESTART_CHANNEL = 'request-app-restart';
const SIGN_IN = 'sign-in';
const WRITE_GEO_OBJECT = 'write-geo-object';
const FETCH_DISTRICT = 'fetch-district';
const FETCH_USERLIST = 'fetch-userlist';
const FETCH_DIVISION = 'fetch-division';
const FETCH_UPAZILA = 'fetch-upazila';
const FETCH_USERNAME = 'fetch-username';
const FETCH_IMAGE = 'fetch-image';
const AUTO_UPDATE = 'auto-update';
const FETCH_LAST_SYNC = 'fetch-last-sync';
const EXPORT_XLSX = 'export-xlsx';
const DELETE_INSTANCE = 'delete-instance';
const FORM_DETAILS = 'form-details';
const USER_DB_INFO = 'user-db-info';
const LOGIN_OPERATION = 'login-operation';

const { app, BrowserWindow, ipcMain } = electron;
const DB_NAME = 'foobar.db';
let mainWindow;
let prevPercent = 0;
let newPercent = 0;

// App/** creates window on app ready */
app.on(APP_READY_STATE, createWindow);

/** adds window on app if window null */
app.on(APP_ACTIVATE_STATE, () => {
  const isFirstRun = firstRun()
  if (isFirstRun || cmd == '--squirrel-firstrun') {
    afterInstallation();
  }
  if (mainWindow === null) {
    createWindow();
  }
});

function afterInstallation () {
  dialog.showMessageBox({
    title: 'No Updates',
    message: 'Current version is up-to-date.',
  });
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    fs.unlink(path.join(app.getPath("userData"), DB_NAME),function(err){
      if(err) return console.log(err);
    }); 
    db.close();
  } catch (err) {
    console.log('App Setup!!!!');
  }
}

/** creates the db and sets up the window in electron */
function createWindow() {
  // comment next line if react and redux dev extensions not installed
  if (isDev) {
    // addDevToolsExt();
  }
  console.log('create windo ');
  prepareDb();
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    icon: `${__dirname}/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.maximize();
  // mainWindow.setBackgroundColor('#FF0000');
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  // autoUpdater.checkForUpdates();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/** set up new db if not exists */
function prepareDb() {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    // })
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
  console.log(path.join(app.getPath("userData"), DB_NAME));
  const db = new Database(path.join(app.getPath("userData"), DB_NAME));
  // const db = new Database(DB_NAME);
  // const db = new Database(DB_NAME);
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

autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
  dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString());
});

autoUpdater.on('update-available', () => {
  sendStatusToWindow('update_available');
  dialog.showMessageBox(
    {
      type: 'info',
      title: 'Found Updates',
      message: 'Found updates, do you want update now?',
      buttons: ['Sure', 'No'],
    }).then(result => {
        if (result.response === 0) {
          console.log('check downloading');
          sendStatusToWindow('update-downloading');
          autoUpdater.downloadUpdate();
        } else if (result.response === 1) {
          // bound to buttons array
          console.log("Cancel button clicked.");
        }
      },
    // (buttonIndex) => {
    //   console.log('button', buttonIndex);
    //   if (buttonIndex === 0) {
    //     console.log('check downloading');
    //     sendStatusToWindow('update-downloading');
    //     autoUpdater.downloadUpdate();
    //   }
    //   // else {
    //   //   updater.enabled = true
    //   //   updater = null
    //   // }
    // },
  );
});

autoUpdater.on('update-not-available', () => {
  sendStatusToWindow('update_not_available');
  dialog.showMessageBox({
    title: 'No Updates',
    message: 'Current version is up-to-date.',
  });
  // updater.enabled = true
  // updater = null
});

autoUpdater.on('download-progress', (progressObj) => {
  let percent = Math.round(progressObj.percent);
  if (percent - prevPercent >= 1) {
    prevPercent = newPercent;
    newPercent = percent;
    mainWindow.send('download_progress', percent);
  }
  // sendStatusToWindow(log_message);
})

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('update_downloaded');
  dialog.showMessageBox(
    {
      title: 'Install Updates',
      message: 'Updates downloaded, application will be quit for update...',
    }).then(() => {
      setImmediate(() => autoUpdater.quitAndInstall());
    });
});

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('checking_for_update...');
});

/** add the react and redux devtools to electron */
function addDevToolsExt() {
  BrowserWindow.addDevToolsExtension(path.join(os.homedir(), REACT_EXTENSION_PATH));
  BrowserWindow.addDevToolsExtension(path.join(os.homedir(), REDUX_EXTENSION_PATH));
}

// utils
const parseFieldNames = (parentName, possibleNames, currentFormJsn) => {
  currentFormJsn.forEach((currentElem) => {
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
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const listDefinition = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId);
    // console.log(listDefinition);
    const datasource = JSON.parse(listDefinition.datasource);
    const datasourceQuery = datasource.type === '0' ? `select * from ${datasource.query}` : datasource.query;
    const randomTableName = `tab${Math.random().toString(36).substring(2, 12)}`;
    const filterDatasetQuery = db.prepare(
      `with ${randomTableName} as (${datasourceQuery}) select ${filterColumns.toString()} from ${randomTableName} group by ${filterColumns.toString()}`,
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
const fetchAppDefinition = (event) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    // eslint-disable-next-line no-param-reassign
    event.returnValue = db.prepare('SELECT definition from app where app_id=1').get().definition;
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
  deleteDataWithInstanceId(JSON.parse(response.data)['meta/instanceID'], response.formId)
  const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
  const fetchedUsername = db.prepare('SELECT username from users order by lastlogin desc limit 1').get();
  event.returnValue = {
    username: fetchedUsername.username,
  };
  const date = new Date().toISOString();
  const insert = db.prepare('INSERT INTO data (form_id,data, status,  submitted_by, submission_date, instanceid) VALUES (@formId, @data, 0, ?, ?, ?)');
  insert.run(response, fetchedUsername.username, date, response.data ? JSON.parse(response.data)['meta/instanceID'] : '');
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
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const formDefinitionObj = db.prepare('SELECT * from forms where form_id = ? limit 1').get(formId);
    if (formDefinitionObj != undefined) {
      const choiceDefinition = formDefinitionObj.choice_definition ? JSON.parse(formDefinitionObj.choice_definition) : {};
      const choices = {};
      Object.keys(choiceDefinition).forEach((key) => {
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
    } else {
      event.returnValue = null;
    }
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

const fetchFormChoices=(event, formId)=> {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });

    console.log('------------------- form id: ', formId);
    const formchoices = db.prepare(`SELECT * from form_choices where xform_id = ${formId} `).all();

    console.log(formchoices);
    event.returnValue = formchoices;
    db.close();

  } catch(err) {
    console.log('------------- error fetch form choices ------------------');
  } finally {

  }
  
}

const fetchFormDetails = (event, listId) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const formData = db.prepare('SELECT * from data where data_id = ? limit 1').get(listId);
    console.log(formData)
    if (formData != undefined) {
      // eslint-disable-next-line no-param-reassign
      event.returnValue = { formDetails: formData };
    } else {
      event.returnValue = null;
    }
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
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const fetchedRows = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId);
    // eslint-disable-next-line no-param-reaFssign
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
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

const fetchFormListDefinition = (event, formId) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const query = 'SELECT * from data where form_id = "' + formId + '"';
    const fetchedRows = db.prepare(query).all();
    // eslint-disable-next-line no-param-reaFssign
    event.returnValue = {fetchedRows};
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
}

const fetchFollowupFormData = (event, formId, detailsPk, pkValue, constraint) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    let query;
    if (constraint == 'equal') {
      query = "SELECT data_id, submitted_by, submission_date, data from data where form_id = '" + formId + "' and json_extract(data, '$."+ detailsPk +"') = '" + pkValue +"'";
    } else {
      query = "SELECT data_id, submitted_by, submission_date, data from data where form_id = '" + formId + "' and json_extract(data, '$."+ detailsPk +"') LIKE '%" + pkValue +"%'";
    }
    const fetchedRows = db.prepare(query).all();
    // eslint-disable-next-line no-param-reaFssign
    event.returnValue = {fetchedRows};
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
}

/** fetches the data based on query
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} queryString- the query string
 * @returns - the returned dataset from the query
 */
const fetchQueryData = (event, queryString) => {
  console.log(queryString);
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const fetchedRows = db.prepare(queryString).all();
    // eslint-disable-next-line no-param-reassign
    event.returnValue = fetchedRows;
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};

const loginOperation = async(event, obj)=> {
  console.log('i am in login operation');

  const db_path = path.join(app.getPath("userData"), DB_NAME);
  fsExtra.removeSync(db_path); 
  const db = new Database(path.join(app.getPath("userData"), DB_NAME));
  // const db = new Database(DB_NAME);
  console.log('new db setup call after delete previous user data');
  db.exec(queries);
  
  const {response, userData} = obj;
   const insertStmt = db.prepare(
      `INSERT INTO users (username, password, macaddress, lastlogin, name, role, organization, branch, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const data = response;
    insertStmt.run(
      userData.username,
      userData.password,
      '70:66:55:b0:13:6b',
      Math.round(new Date().getTime()),
      data.name,
      data.role,
      data.organization,
      data.branch,
      data.email,
    );
    results = { username: data.user_name, message: '' };
    // event.sender.send('formSubmissionResults', results);
    mainWindow.send('formSubmissionResults', results);
    event.returnValue = {
      userInfo: data,
      // message: ""
    };
    db.close();

}

// eslint-disable-next-line no-unused-vars
const signIn = async (event, userData) => {
  let mac;
  macaddress.one(function (err, mac) {
    mac = mac;
    console.log(mac);
  });
  const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
  // const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
  const query =
    'SELECT * from users limit 1';
  const userInfo = db.prepare(query).get();
  // const info = userInfo.user_id;

    const data = {
      username: userData.username,
      password: userData.password,
      mac_address: mac,
      upazila: 202249,
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
      .then((response) => {
        let results= '';
        console.log('-----------signin response --------------');
        console.log(response);
        if (!(Object.keys(response.data).length === 0 && response.data.constructor === Object)) {
          // if (response.status == 200 || response.status == 201) {
            console.log('sign in successfull: ');

          if(userInfo === undefined) {
            const db = new Database(path.join(app.getPath("userData"), DB_NAME));
            const insertStmt = db.prepare(
                  `INSERT INTO users (username, password, macaddress, lastlogin, name, role, organization, branch, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                );
                const data = response.data;
                insertStmt.run(
                  userData.username,
                  userData.password,
                  mac,
                  Math.round(new Date().getTime()),
                  data.name,
                  data.role,
                  data.organization,
                  data.branch,
                  data.email,
                );
            results = { username: response.data.user_name, message: '' };
            // event.sender.send('formSubmissionResults', results);
            mainWindow.send('formSubmissionResults', results);
            event.returnValue = {
              userInfo: response.data,
              // message: ""
            };
          }
          else if(userInfo && userInfo.username !== response.data.user_name) {
            results = {
              response: response.data,
               userData,
            };
            mainWindow.send('deleteTableDialogue', results);
          }
          else {
            results = { username: response.data.user_name, message: '' };
            mainWindow.send('formSubmissionResults', results);
            event.returnValue = {
              userInfo: response.data,
              // message: ""
            };
          }
      
        } else if (response.status == 409) {
          results = {
            message: 'Un-authenticated Really',
            username: '',
          };
          mainWindow.send('formSubmissionResults', results);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log(error);
        results = {
          message: 'Un-authenticated User',
          username: '',
        };
        mainWindow.send('formSubmissionResults', results);
      });
  
  db.close();
};

const populateGeoTable = (event, geoList) => {
  console.log(app.getPath("userData"));
  const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
  const geoData = geoList ? geoList['catchment-area.csv'] : [];
  // console.log('call', geoData);
  db.prepare('DELETE FROM geo').run();
  if (geoData.length) {
    const insertStmt = db.prepare(
      `INSERT INTO geo (div_id, division, dis_id, district, upz_id, upazila) VALUES (@div_id, @division, @dis_id, @district, @upz_id, @upazila)`,
    );

    const insertMany = db.transaction((geos) => {
      // console.log(geos);
      for (const geo of geos)
        insertStmt.run({
          div_id: geo.division,
          division: geo.division_label,
          dis_id: geo.district,
          district: geo.dist_label,
          upz_id: geo.upazila,
          upazila: geo.upazila_label,
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

const populateCatchment = (catchments) => {
  console.log('catchments', catchments.length);
  const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
  db.prepare('DELETE FROM geo_cluster').run();
  const geoData = catchments ? catchments : [];
  // console.log('call', geoData);
  if (geoData.length) {
    const insertStmt = db.prepare(
      `INSERT INTO geo_cluster (value, name, loc_type , parent) VALUES (@value, @name, @loc_type, @parent)`,
    );

    const insertMany = db.transaction((geos) => {
      // console.log(geos);
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
  db.close();
};

const populateModuleImage = (module) => {
  const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });

  const insertStmt = db.prepare(
    `INSERT INTO module_image (module_id, image_name, directory_name) VALUES (@module_id, @image_name, @directory_name)`,
  );

  if (module.img_id.length > 5) {
    const query = 'SELECT * from module_image WHERE image_name = "' + module.img_id + '"';
    const existingImage = db.prepare(query).all();

    if (existingImage.length) {
      insertStmt.run({
        module_id: module.name,
        image_name: module.img_id,
        directory_name: existingImage[0].directory_name,
      });
    } else {
      const options = {
        url: SERVER_URL + '/' + module.img_id,
        dest: 'src/assets/images', // will be saved to /path/to/dest/image.jpg
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
        },
      };

      download
        .image(options)
        .then(({ filename }) => {
          const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
          const insertStmt = db.prepare(
            `INSERT INTO module_image (module_id, image_name, directory_name) VALUES (?, ?, ?)`,
          );
          insertStmt.run(module.name, module.img_id, filename);
          db.close();
        })
        .catch((err) => {
          const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
          const insertStmt = db.prepare(
            `INSERT INTO module_image (module_id, image_name, directory_name) VALUES (?, ?, ?)`,
          );
          insertStmt.run(module.name, module.img_id, '');
          db.close();
        });
    }
  } else {
    insertStmt.run({
      module_id: module.name,
      image_name: module.img_id,
      directory_name: '',
    });
  }

  db.close();
  for (let i = 0; i < module.children.length; i++) {
    populateModuleImage(module.children[i]);
  }
};

const updateAppDefinition = (appDefinition) => {
  let update = function(module)  {
    if (module.xform_id != '') {
       const formModule = {
          xform_id: module.xform_id,
          name: module.name,
          img_id: module.img_id,
          children: [],
          label:  {
            Bangla: 'New Submission',
            English: 'New Submission',
          },
          catchment_area: module.catchment_area,
          list_id: "",
          type: "form",
          id: module.id
       };
       const listId = random(100,200)
       const listModule = {
          xform_id: module.xform_id,
          name: 'module_' + listId,
          img_id: "",
          children: [],
          label:  {
            Bangla: 'Submitted Data',
            English: 'Submitted Data',
          },
          catchment_area: module.catchment_area,
          list_id: "",
          type: "form_list",
          id: listId
       }
       module.xform_id = "";
       module.name ='module_' + listId;
       module.img_id = "";
      //  module.childre = {
      //    formModule,
      //    listModule
      //  }
       module.children.push(formModule);
       module.children.push(listModule);
       module.type = "container";
       module.id = listId;
    } else if (module.children)
      module.children.forEach((mod) => {
        update(mod)
      });
  };
  
  appDefinition.children.forEach((definition) => {
    update(definition)
  });

  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    // const layoutDeleteQuery = db.prepare('DELETE FROM app WHERE app_id = 2');
    // layoutDeleteQuery.run();
    const newLayoutQuery = db.prepare('INSERT INTO app(app_id, app_name, definition) VALUES(1, ?,?)');
    newLayoutQuery.run('Bahis_Updated', JSON.stringify(appDefinition));
    db.close()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    // db.close();
  }
}

const exportExcel = (event, excelData) => {
  filename = dialog.showSaveDialog({
    filters: [{
      name: 'Bahis',
      extensions: ['xls']
    }]
  }
    ).then(result => {
      filename = result.filePath;
      if (filename === undefined) {
        console.log(filename);
        dialog.showMessageBox({
          title: 'Download Updates',
          message: 'couldn\'t create a file.',
        });
        return;
      }
      // const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      // const data = JSON.parse(excelData);
      fs.writeFile(filename,new Buffer(excelData), (err) => {
        if (err) {
          console.log('an error ocurred with file creation ' + err.message);
          dialog.showMessageBox({
            title: 'Download Updates',
            message: `an error ocurred with file creation ${err.message}`,
          });
          return
        }
        dialog.showMessageBox({
          title: 'Download Updates',
          message: 'File Downloaded Successfully',
        });
      })
    }).catch(err => {
      dialog.showMessageBox({
        title: 'Download Updates',
        message: `${err}`,
      });
      console.log(err);
    });
}

const fetchUsername = (event) => {
  console.log('check call');
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
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

const fetchLastSyncTime = (event) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const last_updated = db.prepare('SELECT last_updated from data order by last_updated desc limit 1').get();
    console.log(last_updated);
    const updated = last_updated == undefined || last_updated.last_updated == null ? 0 : last_updated.last_updated;
    // eslint-disable-next-line no-param-reassign
    console.log('updated', updated);
    event.returnValue = {
      lastSync: updated,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    // db.close();
  }
};

const fetchImage = (event, moduleId) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const query = 'SELECT directory_name FROM module_image where module_id="' + moduleId + '"';
    const fetchedRows = db.prepare(query).get();
    event.returnValue = fetchedRows != null ? fetchedRows.directory_name : '';
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
  }
};

const fetchUserList = (event) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const fetchedRows = db.prepare('SELECT DISTINCT	username, name FROM users').all();
    // eslint-disable-next-line no-param-reassign
    console.log(fetchedRows);
    event.returnValue = {
      users: fetchedRows,
    };
    db.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    db.close();
  }
}

const fetchDivision = (event) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
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
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const query =
      'SELECT DISTINCT upz_id, upazila FROM geo WHERE div_id = "' + divisionId + '" AND dis_id = "' + districtId + '"';
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
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
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

const getDBTablesEndpoint = (time) => {
  // const log = db.prepare('SELECT * from app_log order by time desc limit 1').get();
  // const time = log === undefined ? 0 : Math.round(log.time);
  const db_endpoint_url = DB_TABLES_ENDPOINT.replace('?', time);
  return db_endpoint_url;
};

const startAppSync = (event, name) => {
  try {
    //  const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const log = db.prepare('SELECT * from app_log order by time desc limit 1').get();
    const time = log === undefined ? 0 : Math.round(log.time);
    axios
      .all([
        axios.get(getDBTablesEndpoint(time).replace('core_admin', name)),
        axios.get(APP_DEFINITION_ENDPOINT.replace('core_admin', name)),
        axios.get(FORMS_ENDPOINT.replace('core_admin', name)),
        axios.get(LISTS_ENDPOINT.replace('core_admin', name)),
        axios.get(FORM_CHOICE_ENDPOINT.replace('core_admin', name))
      ])
      .then(
        axios.spread((formConfigRes, moduleListRes, formListRes, listRes, formChoice) => {
          if (formConfigRes.data) {
            if (formConfigRes.data.length > 0) {
              const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
              const maxUpdateTime = Math.max(...formConfigRes.data.map((obj) => obj.updated_at), 0);
              newLayoutQuery.run(maxUpdateTime);
              console.log('app log data --> ', db.prepare('SELECT * from app_log order by time desc limit 1').get());
            }

            formConfigRes.data.forEach((sqlObj) => {
              if (sqlObj.sql_script) {
                try {
                  db.exec(sqlObj.sql_script);
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.log('db data table creation failed !!!', err);
                }
              }
            });
          }
          if (moduleListRes.data) {
            const layoutDeleteQuery = db.prepare('DELETE FROM app');
            
            try {
              layoutDeleteQuery.run();
            } catch (err) {
              // eslint-disable-next-line no-console
              console.log('Previous Layout does not exist');
            }
            db.prepare('DELETE FROM module_image').run();
            populateModuleImage(moduleListRes.data);
            populateCatchment(moduleListRes.data.catchment_area);
            // const newLayoutQuery = db.prepare('INSERT INTO app(app_id, app_name, definition) VALUES(1, ?,?)');
            // newLayoutQuery.run('Bahis', JSON.stringify(moduleListRes.data));
            updateAppDefinition(moduleListRes.data);
          }
          if (formListRes.data) {
            const previousFormDeletionQuery = db.prepare('DELETE FROM forms WHERE form_id = ?');
            const newFormInsertionQuery = db.prepare(
              'INSERT INTO forms(form_id, form_name, definition, choice_definition, form_uuid, table_mapping, field_names) VALUES(?,?,?,?,?,?,?)',
            );
            formListRes.data.forEach(async (formObj) => {
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
                  JSON.stringify(fieldNames),
                );
              } catch (err) {
                // eslint-disable-next-line no-console
                console.log('db form insertion failed !!!', err);
              }
            });
            if (listRes.data) {
              const previousListDeletionQuery = db.prepare('DELETE FROM lists WHERE list_id = ?');
              const newListInsertQuery = db.prepare(
                'INSERT INTO lists(list_id, list_name, list_header, datasource, filter_definition, column_definition) VALUES(?,?,?,?,?,?)',
              );
              listRes.data.forEach((listObj) => {
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
                    JSON.stringify(listObj.column_definition),
                  );
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.log('db list insertion failed', err);
                }
              });
            }
            if (formChoice.data) {
              const previousFormChoices = db.prepare('DELETE FROM form_choices WHERE id > 0');

              try {
                previousFormChoices.run();
              } catch (err) {
                console.log(' db form_choice insertion failed');
              }

              const insertQuery = db.prepare(
                'INSERT INTO form_choices( value_text, xform_id, value_label, field_name, field_type) VALUES(?,?,?,?,?)',
              );

              console.log('---------------------------- form choice data ---------------------');
              console.log(formChoice.data.length);

              try {
                formChoice.data.forEach(async (formObj) => {
                  insertQuery.run(
                    formObj.value_text,
                    String(formObj.xform_id),
                    formObj.value_label,
                    formObj.field_name,
                    formObj.field_type);
                });
              } catch (err) {
                console.log(' ')
              }
            }
          }
          csvDataSync(name);
          // eslint-disable-next-line no-param-reassign
          let message = 'done';
          mainWindow.send('formSyncComplete', message);
          db.close();
        }),
      )
      .catch((err) => {
        let message = '';
        if (time == 0) {
          message = 'nope'
        } else {
          message = 'done'
        }
        console.log(err);
        mainWindow.send('formSyncComplete', message);
        // eslint-disable-next-line no-console
        console.log('Axios FAILED in startAppSync');
      });
  } catch (err) {
    console.log('try catch');
    let message = '';
    if (time == 0) {
      message = 'nope'
    } else {
      message = 'done'
    }
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
  csvDataSync(username);
  mainWindow.send('dataSyncComplete', msg);
  console.log('----------------------------------- complete data sync ----------------------------------------');
  event.returnValue = msg;
};

/** starts csv data sync on request event
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns {string} - success when completes; otherwise, failed if error occurs
 */
const csvDataSync = async (username) => {
  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const tableExistStmt = 'SELECT name FROM sqlite_master WHERE type="table" AND name="csv_sync_log"';
    const info = db.prepare(tableExistStmt).get();
    if(info && info.name == 'csv_sync_log') {
      fetchCsvDataFromServer(username);
    } else {
      console.log('info', info);
      db.prepare('CREATE TABLE csv_sync_log( time TEXT)').run();
      fetchCsvDataFromServer(username);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('table create err', err);
    return 'failed';
  }
};

const getUserDBInfo =(event)=>{

  try {
    const db = new Database(path.join(app.getPath("userData"), DB_NAME), { fileMustExist: true });
    const query  = `with division as (
                      select name, value, 'catchment-area' as ca from geo_cluster where parent = -1
                  ), district as (
                      select name , value, 'catchment-area' as ca from geo_cluster where parent = (select value from division limit 1)
                  ), upazila as (
                      select name , value, 'catchment-area' as ca from geo_cluster where parent = (select value from district limit 1)
                  ) select
                          division.value division,
                          district.value district,
                          upazila.value upazila
                  from division join district on division.ca = district.ca
                      join upazila on upazila.ca = division.ca`

    const info = db.prepare(query).get();
    console.log(info);
    event.returnValue = info;
  } catch(err) {
    console.log("error while fetching user location ", err);
  }
}

const deleteData = (event, instanceId, formId) => {
  console.log(instanceId, formId);
  deleteDataWithInstanceId(instanceId.toString(), formId);
  event.returnValue = {
    status: 'successful',
  };
}

/** restarts the app
 * @param {IpcMainEvent} _event - the default ipc main event
 */
// eslint-disable-next-line no-unused-vars
const requestRestartApp = async (_event) => {
  app.relaunch();
  app.exit();
};

const autoUpdate = (event) => {
  console.log('check update call');
  // autoUpdater.checkForUpdates();
};

// subscribes the listeners to channels
ipcMain.on(APP_DEFINITION_CHANNEL, fetchAppDefinition);
ipcMain.on(FORM_SUBMISSION_CHANNEL, submitFormResponse);
ipcMain.on(FORM_DEFINITION_CHANNEL, fetchFormDefinition);
ipcMain.on(FORM_CHOICES_CHANNEL, fetchFormChoices);
ipcMain.on(LIST_DEFINITION_CHANNEL, fetchListDefinition);
ipcMain.on(SUBMITTED_FORM_DEFINITION_CHANNEL, fetchFormListDefinition);
ipcMain.on(FETCH_LIST_FOLLOWUP, fetchFollowupFormData);
ipcMain.on(QUERY_DATA_CHANNEL, fetchQueryData);
ipcMain.on(START_APP_CHANNEL, startAppSync);
ipcMain.on(DATA_SYNC_CHANNEL, requestDataSync);
ipcMain.on(CSV_DATA_SYNC_CHANNEL, csvDataSync);
ipcMain.on(FILTER_DATASET_CHANNEL, fetchFilterDataset);
ipcMain.on(APP_RESTART_CHANNEL, requestRestartApp);
ipcMain.on(SIGN_IN, signIn);
ipcMain.on(WRITE_GEO_OBJECT, populateGeoTable);
ipcMain.on(FETCH_USERLIST, fetchUserList);
ipcMain.on(FETCH_DIVISION, fetchDivision);
ipcMain.on(FETCH_DISTRICT, fetchDistrict);
ipcMain.on(FETCH_UPAZILA, fetchUpazila);
ipcMain.on(FETCH_IMAGE, fetchImage);
ipcMain.on(FETCH_USERNAME, fetchUsername);
ipcMain.on(FETCH_LAST_SYNC, fetchLastSyncTime);
ipcMain.on(AUTO_UPDATE, autoUpdate);
ipcMain.on(EXPORT_XLSX, exportExcel);
ipcMain.on(DELETE_INSTANCE, deleteData)
ipcMain.on(FORM_DETAILS, fetchFormDetails);
ipcMain.on(USER_DB_INFO, getUserDBInfo);
ipcMain.on(LOGIN_OPERATION, loginOperation);