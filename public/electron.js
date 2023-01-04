// eslint-disable-next-line import/no-extraneous-dependencies
//imports
const electron = require('electron');
const electronLog = require('electron-log');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const os = require('os');
const axios = require('axios');
const { dialog } = require('electron');
var macaddress = require('macaddress');
const { autoUpdater } = require('electron-updater');
autoUpdater.logger = electronLog;
autoUpdater.logger.transports.file.level = "info";

const { random } = require('lodash');
const download = require('image-downloader');
const fs = require('fs');
const { fetchDataFromServer, sendDataToServer, parseAndSaveToFlatTables, deleteDataWithInstanceId, fetchCsvDataFromServer, queries } = require('./modules/syncFunctions');
const firstRun = require('electron-first-run');
const {
  formConfigEndpoint,
  _url,
  SERVER_URL,
  CATCHMENT_DEFINITION_ENDPOINT,
  APP_DEFINITION_ENDPOINT,
  FORMS_ENDPOINT,
  LISTS_ENDPOINT,
  SIGN_IN_ENDPOINT,
  FORM_CHOICE_ENDPOINT,
} = require('./constants');

const { app, BrowserWindow, ipcMain } = electron;
const DB_NAME = 'bahis.db';
const dbfile = path.join(app.getPath("userData"), DB_NAME)
let db = new Database(dbfile);

let mainWindow;
let prevPercent = 0;
let newPercent = 0;


// App/** creates window on app ready */
// app.on('ready', createWindow);

/** adds window on app if window null */
app.on('ready', () => {
  const isFirstRun = firstRun()
  if (isFirstRun) {
    afterInstallation();
    electronLog.info('Will create a DB on a first run');
    prepareDb(db);
  } else { //we don't check for auto update on the first run, apparently that can cause problems
    autoUpdateBahis();
  }

  createWindow();
  //create a db if doesn't exist
  if (!fs.existsSync(dbfile)){
    db.close();
    electronLog.info('Recreating DB');
    db = new Database(dbfile);
    prepareDb(db);
  }else{
    electronLog.info('Using db in ', dbfile);
  }
});

function afterInstallation() {
  if (!isDev) {
  }
}

/** creates the db and sets up the window in electron */
function createWindow() {


  electronLog.info('created window');



  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    icon: `${__dirname}/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  //TODO TMP use prebuild react so we can change electron code during debug
  // mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);

  if (isDev) {
    mainWindow.setBackgroundColor('#FF0000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.maximize();
  }

  //what does that do?
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/** set up new db */
function prepareDb(db) {
  electronLog.info('------- || Creating New Database || ----------------');
  electronLog.info('Running initial queries');
  try{
    db.exec(queries);
  }catch(err){
    electronLog.info("Failed setting up DB")
    electronLog.info(err)
  }
  electronLog.info('-------- || Database setup finished !!!! || ----------');
}

/** removes window on app close */
app.on('window-all-closed', () => {
    db.close();
    app.quit();
});

function sendStatusToWindow(text) {
  mainWindow.send(text, text);
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
  electronLog.info(`------- || fetchFilterDataset ${event} ${listId} ${filterColumns} || ----------------`);
  try {
    const listDefinition = db.prepare('SELECT * from lists where list_id = ? limit 1').get(listId);
    // electronLog.info(listDefinition);
    const datasource = JSON.parse(listDefinition.datasource);
    const datasourceQuery = datasource.type === '0' ? `select * from ${datasource.query}` : datasource.query;
    const randomTableName = `tab${Math.random().toString(36).substring(2, 12)}`;
    const a = filterColumns.toString();

    sqliteplaceholder = ", ?".repeat(filterColumns -1 );
    const filterDatasetQueryTxt = 'with '.concat(randomTableName,' as (', datasourceQuery, ' ) select ?', sqliteplaceholder, ' from ', randomTableName, ' group by ?', sqliteplaceholder);

    const filterDatasetQuery = db.prepare(filterDatasetQueryTxt);
    const returnedRows = filterDatasetQuery.all(a,a );
    // eslint-disable-next-line no-param-reassign
    event.returnValue = returnedRows;
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(`------- || fetchFilterDataset Error ${err} || ----------------`);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = [];
  }
};

/** fetches the app menu definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns - the app definition json
 */
const fetchAppDefinition = async (event) => {
  electronLog.info(`------- || fetchAppDefinition ${event} || ----------------`);
  try {
    const appResult = db.prepare('SELECT definition from app where app_id=1').get();
    const appResultDefinition = appResult.definition;
    if (appResultDefinition) {
      electronLog.info(`------- || fetchAppDefinition SUCCESS || ----------------`);
      return appResultDefinition;
    } else {
      electronLog.info(`------- || fetchAppDefinition FAILED - undefined || ----------------`);
      return null;
    }
  } catch (err) {
    electronLog.info(`------- || fetchAppDefinition FAILED ${err} || ----------------`);
    return null;
  }
};

/** saves the form response to db
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {Object} response - an object containing formId and data (user's response)
 */
const submitFormResponse = (event, response) => {
  // eslint-disable-next-line no-console
  electronLog.info(`------- || submitFormResponse ${event} ${response} || ----------------`);
  //The following deletes a record when editing an existing entry and replacing it with a new one
  deleteDataWithInstanceId(db, JSON.parse(response.data)['meta/instanceID'], response.formId)
  const fetchedUsername = getCurrentUser();
  event.returnValue = {
    username: fetchedUsername,
  };
  const date = new Date().toISOString();
  const insert = db.prepare('INSERT INTO data (form_id,data, status,  submitted_by, submission_date, instanceid) VALUES (@formId, @data, 0, ?, ?, ?)');
  insert.run(response, fetchedUsername, date, response.data ? JSON.parse(response.data)['meta/instanceID'] : '');
  parseAndSaveToFlatTables(db, response.formId, response.data, null);
  
};

/** fetches the form definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} formId- the form id
 * @returns - the definition of form respective to form id
 */
const fetchFormDefinition = (event, formId) => {
  electronLog.info(`------- || fetchFormDefinition ${event} ${formId} || ----------------`);
  try {
    const formDefinitionObj = db.prepare('SELECT * from forms where form_id = ? limit 1').get(formId);
    if (formDefinitionObj != undefined) {
      const choiceDefinition = formDefinitionObj.choice_definition ? JSON.parse(formDefinitionObj.choice_definition) : {};
      const choices = {};
      Object.keys(choiceDefinition).forEach((key) => {
        try {
          const { query } = choiceDefinition[key];
          choices[`${key}.csv`] = db.prepare(query).all();
        } catch (err) {
          electronLog.info(`------- || Choice Definition Error  ${err} || ----------------`);
        }
      });
      // eslint-disable-next-line no-param-reassign
      electronLog.info(`------- || Choices for form ${formId}:  ${choices} || ----------------`);
      event.returnValue = { ...formDefinitionObj, formChoices: JSON.stringify(choices) };
    } else {
      event.returnValue = null;
      electronLog.info(`------- || fetchFormDefinition problem, no such form with ${formId} || ----------------`);
      electronLog.info(`------- || see 'SELECT * from forms where form_id = ? limit 1' || ----------------`);

    }
    
  } catch (err) {
    electronLog.info(`------- || fetchFormDefinition Error  ${err} || ----------------`);
  }
};

const fetchFormChoices = (event, formId) => {
  try {
    electronLog.info(`------- || fetchFormChoices  ${formId} || ----------------`);
    const formchoices = db.prepare(`SELECT * from form_choices where xform_id = ? `).all(formId);
    event.returnValue = formchoices;
  } catch (err) {
    electronLog.info('------------- error fetch form choices ------------------', err);
  }
}

const fetchFormDetails = (event, listId, column = 'data_id') => {
  electronLog.info(`------- || fetchFormDetails  ${event} ${listId} || ----------------`);
  try {
    const formData = db.prepare(`SELECT * from data where ${column} = ? limit 1`).get(listId);
    electronLog.info(formData)
    if (formData != undefined) {
      event.returnValue = { formDetails: formData };
    } else {
      event.returnValue = null;
    }
  } catch (err) {
    electronLog.info(err);
    electronLog.info(`------- || Fetch FormDetails  ${err} || ----------------`);
  }
};

/** fetches the list definition
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} listId- the list id
 * @returns - the definition of list respective to list id
 */
const fetchListDefinition = (event, listId) => {
  electronLog.info(`------- || fetchListDefinition, listId: ${listId} || ----------------`);
  try {

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
    
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(`------- || fethcListDefinition Error, listId: ${listId} || ----------------`);
  }
};

function getCurrentUser(){
    const query = 'SELECT username from users LIMIT 1';
    const fetchedRow = db.prepare(query).get();
    return fetchedRow.username;
};


const fetchFormListDefinition = (event, formId) => {
  electronLog.info(`------- || fetchFormListDefinition, listId: ${formId} || ----------------`);
  try {
    userName = getCurrentUser();
    const query = 'SELECT * from data where form_id = ? and submitted_by = ?';
    const fetchedRows = db.prepare(query).all(formId, userName);
    // eslint-disable-next-line no-param-reaFssign
    event.returnValue = { fetchedRows };
    
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(`------- || fetchFormListDefinition, listId: ${formId} || ----------------`);
  }
}

const fetchFollowupFormData = (event, formId, detailsPk, pkValue, constraint) => {
  electronLog.info(`------- || fetchFollowupFormData, formId: ${formId} ${detailsPk}, ${pkValue}, ${constraint} || ----------------`);
  try {

    let query;
    if (constraint == 'equal') {
      query = "SELECT data_id, submitted_by, submission_date, data from data where form_id = ? and json_extract(data, '$.?') = ?";
    } else {
      query = "SELECT data_id, submitted_by, submission_date, data from data where form_id = ? and json_extract(data, '$.?') LIKE '%?%'";
    }
    const fetchedRows = db.prepare(query).all(formId, detailsPk, pkValue);
    // eslint-disable-next-line no-param-reaFssign
    event.returnValue = { fetchedRows };
    
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(`------- || fetchFollowupFormData, formId: ${formId} || ----------------`);
  }
}

/** fetches the data based on query
 * @param {IpcMainEvent} event - the default ipc main event
 * @param {string} queryString- the query string
 * @returns - the returned dataset from the query
 */
const fetchQueryData = (event, queryString) => {
  electronLog.info(`------- || fetchQueryData, formId: ${queryString} || ----------------`);
  try {
    const fetchedRows = db.prepare(queryString).all();
    // electronLog.info(JSON.stringify(fetchedRows));
    // eslint-disable-next-line no-param-reassign
    event.returnValue = fetchedRows;
    electronLog.info('---------------------|| fetchQueryData SUCCESS ||---------------------');
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(`------- || fetchQueryData FAILED || ----------------`);
    electronLog.info(err);
    event.returnValue = []; //lack of return here was hanging the frontend which incorectly used sendSync
  }
};

const configureFreshDatabase = async (data, userData, mac) => {
  const insertStmt = db.prepare(
    `INSERT INTO users (username, password, macaddress, lastlogin, name, role, organization, branch, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insertStmt.run(
    data.user_name,
    userData.password,
    mac,
    Math.round(new Date().getTime()),
    data.name,
    data.role,
    data.organization,
    data.branch,
    data.email,
  );

  electronLog.log(`Created db with user details, now synchronising form config and catchments for ${data.user_name}`);
  await synchroniseFormConfig(data.user_name, 0).then(() => {
    synchroniseCatchments(data.user_name, 0);
  });
};

const changeUser = async (event, obj) => {
  let mac;
  macaddress.one(function (err, mac) {
    mac = mac;
  });
  db.close();
  fs.unlinkSync(dbfile);
  electronLog.info('new db setup call after delete previous user data');
  db = new Database(dbfile);
  prepareDb(db);
//   electronLog.info('obj:');
//   electronLog.info(JSON.stringify(obj));
  const { response, userData } = obj;
  configureFreshDatabase(response, userData, mac, event);
  results = { username: response.user_name, message: 'changeUser' };
  mainWindow.send('formSubmissionResults', results);
  event.returnValue = {
    userInfo: response,
    // message: ""
  };
};

const synchroniseFormConfig = async (name, time) => {
  electronLog.info(`----------------- || Synchronising FormConfig (time: ${time}) || ----------------------------`);
  electronLog.info(`api url: ${formConfigEndpoint(name, time)}`);

  await axios.get(`${formConfigEndpoint(name, time)}`).then((formConfigRes) => {
    // we never log the time this was run, as we currently only run it on DB creation
    // We will need to log this when we make it possible for users to resync this?
    // Or will we? Maybe we always use time === 0
    // See also synchroniseCatchments
    // const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
    // newLayoutQuery.run(new Date().getTime());

    if (formConfigRes.data) {
      electronLog.info('---------------------|| formConfigRes data ||---------------------');
      formConfigRes.data.forEach((sqlObj) => {
        if (sqlObj.sql_script) {
          // electronLog.info(JSON.stringify(sqlObj.sql_script));
          try {
            db.exec(sqlObj.sql_script);
          } catch (err) {
            electronLog.info('---------------------|| formConfigRes FAILED ||---------------------');
            electronLog.info('Error: ', err.message);
          }
        }
      });
      electronLog.info('---------------------|| formConfigRes SUCCESS ||---------------------');
    }
  });
};

const synchroniseCatchments = async (name, time) => {
  electronLog.info(`----------------- || Synchronising Catchments (time: ${time}) || ----------------------------`);
  electronLog.info(`api url: ${_url(CATCHMENT_DEFINITION_ENDPOINT, name, time)}`);
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
        electronLog.info('---------------------|| catchmentListRes data ||---------------------');
        populateCatchment(catchmentListRes.data);
      }

      electronLog.info(`----------------- || Synchronising Catchments SUCCESS || ----------------------------`);
    })
    .catch((error) => {
      electronLog.info(
        `----------------- || Synchronising Catchments FAIL|| ----------------------------\n`,
        error.message,
      );
    });
};

const synchroniseModules = async (name, time) => {
  electronLog.info(`----------------- || Synchronising Modules (time: ${time})|| ----------------------------`);
  electronLog.info(`api url: ${_url(APP_DEFINITION_ENDPOINT, name, time)}`);
  axios
    .get(_url(APP_DEFINITION_ENDPOINT, name, time))
    .then((moduleListRes) => {
      const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
      newLayoutQuery.run(new Date().getTime());

      if (moduleListRes.data) {
        electronLog.info('---------------------|| moduleListRes data ||---------------------');
        const layoutDeleteQuery = db.prepare('DELETE FROM app');

        try {
          electronLog.info('clearing app layout');
          layoutDeleteQuery.run();
        } catch (error) {
          // eslint-disable-next-line no-console
          electronLog.info('Previous Layout does not exist');
          electronLog.info(error);
        }
        electronLog.info('clearing module_image');
        db.prepare('DELETE FROM module_image').run();
        updateAppDefinition(moduleListRes.data);
        // Tell the front end the sync is done
        mainWindow.send('formSyncComplete', 'done'); //done is a keyword checked later
      }
      electronLog.info(`----------------- || Synchronising Modules SUCCESS || ----------------------------`);
    })
    .catch((error) => {
      electronLog.info(`----------------- || Synchronising Modules FAIL|| ----------------------------\n`, error);
    });
};

// ------------ NOTE ------------
/**
 * there are four scenario in sign in process
 * 1. when a user login for the first time we save its details in db. and sync for its  modules, forms, lists
 * 2. when a user try to login, we check db for its login history. if we found any, we will forward that user to home page
 * 3. if a user try to login, we will check the db for its login history and if we found a different user then
 *    we will show a delete-data dialog to remove everything related to the previous user
 *    
 */
const signIn = async (event, userData) => {
  electronLog.info(`----------------- || electron-side signIn || ----------------------------`);
  let mac;
  macaddress.one(function (err, mac) {
    mac = mac;
    // electronLog.info(mac);
  });
  const query =
    'SELECT * from users limit 1';
  const userInfo = db.prepare(query).get();
  // if a user has signed in before then no need to call signin-api
  // allowing log in offline. This feautre is currently mostly useless since you cannot use the app until initial synchronisation finishes
  if (userInfo && userInfo.username == userData.username && userInfo.password == userData.password) {
    electronLog.log(`This is an offline-ready account.`);
    results = { username: userData.username, message: 'signIn::local' };
    mainWindow.send('formSubmissionResults', results);
    event.returnValue = {
      userInfo: '',
      message: ''
    };
  } else {
  const data = {
    username: userData.username,
    password: userData.password,
    mac_address: mac,
    upazila: 202249,
  };
  electronLog.info('----------- || Attempt To Signin || -----------------');
  electronLog.info(`signin url: ${SIGN_IN_ENDPOINT}`);
  electronLog.info(`--------------------------`);

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
        let results = '';

        if (!(Object.keys(response.data).length === 0 && response.data.constructor === Object)) {
          // if (response.status == 200 || response.status == 201) {
          electronLog.info('-------|| Signed In received a response! :)  ||-----------');

          // if a user has signed in for the first time
          if (userInfo === undefined) {
            electronLog.info('-------|| New user - setting up local db ||-----------');
            configureFreshDatabase(response.data, userData, mac, event);
            electronLog.info('-------|| Local db configured ||-----------');
            results = { username: response.data.user_name, message: 'signIn::firstTimeUser' };
            mainWindow.send('formSubmissionResults', results);
            event.returnValue = {
              userInfo: response.data,
              // message: ""
            };
          }
          //the user has changed
          else if (userInfo && userInfo.username !== response.data.user_name) {
            electronLog.info('-------|| Change of user - handing back to human ||-----------');
            results = {
              response: response.data,
              userData,
            };
            mainWindow.send('deleteTableDialogue', results);
          }
          //if it is the same user
          else {
            electronLog.info('-------|| Existing user ||-----------');
            // given the offline-ready stuff we do above... do we use this branch?
            results = { username: response.data.user_name, message: 'signIn::offlineUser' };
            mainWindow.send('formSubmissionResults', results);
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
          mainWindow.send('formSubmissionResults', results);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        results = {
          message: getErrorMessage(error),
          username: '',
        };
        mainWindow.send('formSubmissionResults', results);
        electronLog.info('-------|| Sign In Error ||-----------');
        electronLog.info(error);
      });
  }
};

const getErrorMessage = (error) => {
  electronLog.info(error.message);
  if (error.message.includes("409")) return "Users credentials are not authorized or missing catchment area."
  else return "Unauthenticated User.";
}


const populateCatchment = (catchments) => {
  electronLog.info(`------- || populateCatchment: ${catchments.length} || ----------------`);
  db.prepare('DELETE FROM geo_cluster').run();
  const geoData = catchments ? catchments : [];
  // electronLog.info('call', geoData);
  if (geoData.length) {
    const insertStmt = db.prepare(
      `INSERT INTO geo_cluster (value, name, loc_type , parent) VALUES (@value, @name, @loc_type, @parent)`,
    );

    const insertMany = db.transaction((geos) => {
      // electronLog.info(geos);
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

const populateModuleImage = (module) => {
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
      
          const insertStmt = db.prepare(
            `INSERT INTO module_image (module_id, image_name, directory_name) VALUES (?, ?, ?)`,
          );
          insertStmt.run(module.name, module.img_id, filename);
          
        })
        .catch((err) => {
      
          const insertStmt = db.prepare(
            `INSERT INTO module_image (module_id, image_name, directory_name) VALUES (?, ?, ?)`,
          );
          insertStmt.run(module.name, module.img_id, '');
          
        });
    }
  } else {
    insertStmt.run({
      module_id: module.name,
      image_name: module.img_id,
      directory_name: '',
    });
  }

  
  for (let i = 0; i < module.children.length; i++) {
    populateModuleImage(module.children[i]);
  }
};

const updateAppDefinition = (appDefinition) => {
  electronLog.info(`------- || updateAppDefinition || ----------------`);
  electronLog.info(JSON.stringify(appDefinition.name));
  let update = function (module) {
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
        list_id: "",
        type: "form",
        id: module.id
      };
      const listId = random(100, 200)
      const listModule = {
        xform_id: module.xform_id,
        name: 'module_' + listId,
        img_id: "",
        children: [],
        label: {
          Bangla: 'Submitted Data',
          English: 'Submitted Data',
        },
        catchment_area: module.catchment_area,
        list_id: "",
        type: "form_list",
        id: listId
      }
      module.xform_id = "";
      module.name = 'module_' + listId;
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

    // const layoutDeleteQuery = db.prepare('DELETE FROM app WHERE app_id = 2');
    // layoutDeleteQuery.run();
    const newLayoutQuery = db.prepare('INSERT INTO app(app_id, app_name, definition) VALUES(1, ?,?)');
    newLayoutQuery.run('Bahis_Updated', JSON.stringify(appDefinition));
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(err);
    // 
  }
  electronLog.info(`------- || updateAppDefinition FINISHED || ----------------`);
};

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
      electronLog.info(filename);
      dialog.showMessageBox({
        title: 'Download Updates',
        message: 'couldn\'t create a file.',
      });
      return;
    }
    // const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    // const data = JSON.parse(excelData);
    fs.writeFile(filename, new Buffer(excelData), (err) => {
      if (err) {
        electronLog.info(`------- || an error occured with file creation,  ${err} || ----------------`);
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
    electronLog.info(`------- || export excel error: ${err} || ----------------`);
  });
}

const fetchUsername = (event, infowhere) => {
  electronLog.info(`------- || fetchUsername: ${infowhere} || ----------------`);
  try {
    const fetchedUsername = db.prepare('SELECT username from users order by lastlogin desc limit 1').get();
    // eslint-disable-next-line no-param-reassign
    electronLog.info('XIM2, we fetched', JSON.stringify(fetchedUsername));
    event.returnValue = {
      username: fetchedUsername.username,
    };
    electronLog.info(`------- || fetchUsername SUCCESS || ----------------`);
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(`------- || fetchUsername FAILED ${err} || ----------------`);
    //
  }
};

const fetchImage = (event, moduleId) => {
  electronLog.info(`------- || fetchImage: ${moduleId} || ----------------`);
  try {
    const query = 'SELECT directory_name FROM module_image where module_id=?';
    const fetchedRows = db.prepare(query).get(moduleId);
    event.returnValue = fetchedRows != null ? fetchedRows.directory_name : '';
    electronLog.info(`------- || fetchImage SUCCESS || ----------------`);
  } catch (err) {
    electronLog.info(`------- || fetchImage FAILED ${err} || ----------------`);
  }
};

const fetchUserList = (event) => {
  try {

    const fetchedRows = db.prepare('SELECT DISTINCT	username, name FROM users').all();
    // eslint-disable-next-line no-param-reassign
    electronLog.info(fetchedRows);
    event.returnValue = {
      users: fetchedRows,
    };
    
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.info(err);
    
  }
}

const fetchGeo = (event, level, divisionId, districtId) => {
  electronLog.info("Fetchin geodata");
  if (level==="division"){
    const fetchedRows = db.prepare('SELECT DISTINCT	div_id, division FROM geo').all();
    event.returnValue = {
      division: fetchedRows,
    };

  } else if (level==="district"){
    const query = 'SELECT DISTINCT dis_id, district FROM geo WHERE div_id = ?';
    const fetchedRows = db.prepare(query).all(divisionId);
    event.returnValue = {
      district: fetchedRows,
    };
  } else { //upazila
    const query =
      'SELECT DISTINCT upz_id, upazila FROM geo WHERE div_id = ? AND dis_id = ?';
    const fetchedRows = db.prepare(query).all(divisionId,districtId);
    event.returnValue = {
      upazila: fetchedRows,
    };
  }
};

/** sync and updates app on start up
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns - success if sync successful
 */

const startAppSync = (event, name, time) => {
  electronLog.info('--------- || App Sync Started || ------------------');
  electronLog.info('----------|| Below API will be called || -----------');

  let last_sync_time = 0;
  if (time === undefined) {
    const log = db.prepare('SELECT * from app_log order by time desc limit 1').get();
    last_sync_time = log === undefined ? 0 : Math.round(log.time);
  }

  electronLog.info(`${_url(FORMS_ENDPOINT, name, last_sync_time)}`);
  electronLog.info(`${_url(LISTS_ENDPOINT, name, last_sync_time)}`);
  electronLog.info(`${_url(FORM_CHOICE_ENDPOINT, name, last_sync_time)}`);
  electronLog.info('-----------------------------------------------------');

  axios
    .all([
      axios.get(_url(FORMS_ENDPOINT, name, last_sync_time)),
      axios.get(_url(LISTS_ENDPOINT, name, last_sync_time)),
      axios.get(_url(FORM_CHOICE_ENDPOINT, name, last_sync_time)),
    ])
    .then(
      axios.spread((formListRes, listRes, formChoice) => {
        const newLayoutQuery = db.prepare('INSERT INTO app_log(time) VALUES(?)');
        newLayoutQuery.run(new Date().getTime());
        if (formListRes.data) {
          electronLog.info(
            `---------------------|| FormListRes data (time: ${last_sync_time}; total: ${formListRes.data.length}) ||---------------------`,
          );
          const previousFormDeletionQuery = db.prepare('DELETE FROM forms WHERE form_id = ?');
          const newFormInsertionQuery = db.prepare(
            'INSERT INTO forms(form_id, form_name, definition, choice_definition, form_uuid, table_mapping, field_names) VALUES(?,?,?,?,?,?,?)',
          );
          formListRes.data.forEach(async (formObj) => {
            try {
              previousFormDeletionQuery.run(formObj.id);
            } catch (err) {
              // eslint-disable-next-line no-console
              // electronLog.info('Deletion Failed ! Previous form not exists!!');
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
              electronLog.info('db form insertion failed !!!', err);
            }
          });
          if (listRes.data) {
            electronLog.info(
              `---------------------|| ListRes data (time: ${last_sync_time}; total: ${listRes.data.length}) ||---------------------`
            );
            const previousListDeletionQuery = db.prepare('DELETE FROM lists WHERE list_id = ?');
            const newListInsertQuery = db.prepare(
              'INSERT INTO lists(list_id, list_name, list_header, datasource, filter_definition, column_definition) VALUES(?,?,?,?,?,?)',
            );
            listRes.data.forEach((listObj) => {
              try {
                previousListDeletionQuery.run(listObj.id);
              } catch (err) {
                // eslint-disable-next-line no-console
                // electronLog.info('Deletion Failed ! Previous list not exists!!');
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
                electronLog.info('db list insertion failed', err);
              }
            });
          }
          if (formChoice.data) {
            electronLog.info(
              `--------------------- || formChoice data (time: ${last_sync_time}; total: ${formChoice.data.length}) ||---------------------`
            );
            const previousFormChoices = db.prepare(
              'DELETE FROM form_choices WHERE value_text = ? and field_name = ? and xform_id = ? ',
            );

            const insertQuery = db.prepare(
              'INSERT INTO form_choices( value_text, xform_id, value_label, field_name, field_type) VALUES(?,?,?,?,?)',
            );

            electronLog.info('----------------------------|| total form choice data ||---------------------');
            electronLog.info(formChoice.data.length);

            formChoice.data.forEach(async (formObj) => {
              try {
                previousFormChoices.run(formObj.value_text, formObj.field_name, formObj.xform_id);
              } catch (err) {
                electronLog.info(' db form_choice deletion failed');
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
                electronLog.info(' db form_choice insertion failed');
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
    .then(() => {
        // sync the csv Data ?
        csvDataSync(db, name);
    })
    .catch((err) => {
      electronLog.info(`----------------- || App Sync Failed At Login || ----------------------------\n`, err);
    });
};

/** starts data sync on request event
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns {string} - success when completes; otherwise, failed if error occurs
 */
const requestDataSync = async (event, username) => {
  electronLog.info("requesting data sync...")
  await fetchDataFromServer(db, username);
  const msg = await sendDataToServer(db, username, mainWindow);
  csvDataSync(db, username);
  electronLog.info('----------------------------------- complete data sync ----------------------------------------');
  event.returnValue = msg;
};

/** starts csv data sync on request event
 * @param {IpcMainEvent} event - the default ipc main event
 * @returns {string} - success when completes; otherwise, failed if error occurs
 */
const csvDataSync = async (db, username) => {
  electronLog.info("XIM1 csvDataSync")
  try {
    const tableExistStmt = 'SELECT name FROM sqlite_master WHERE type=? AND name=?';
    const info = db.prepare(tableExistStmt).get('table','csv_sync_log');
    if (info && info.name == 'csv_sync_log') {
      fetchCsvDataFromServer(db, username);
    } else {
      electronLog.info('I think that csv_sync_log table does not exist so I will create it');
      db.prepare('CREATE TABLE csv_sync_log( time TEXT)').run();
      fetchCsvDataFromServer(db, username);
    }
    electronLog.info(`------- || csvDataSync  SUCCESS || ----------------`);
  } catch (err) {
    electronLog.info(`------- || csvDataSync FAILED || ----------------`);
    electronLog.info(err);
    return 'failed';
  }
};

const getUserDBInfo = (event) => {
  // FIXME this function is actually about user location and is badly named
  try {
    const query = `with division as (
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
    if (info !== undefined) {
      electronLog.info(`------- || userDB SUCCESS ${info} || ----------------`);
      event.returnValue = info;
    } else {
      electronLog.info(`------- || userDB FAILED - undefined || ----------------`);
    }
  } catch (err) {
    electronLog.info(`------- || userDBInfo FAILED ${err} || ----------------`);
  }
};

const deleteData = (event, instanceId, formId) => {
  electronLog.info(instanceId, formId);
  deleteDataWithInstanceId(db, instanceId.toString(), formId);
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

const autoUpdateBahis = (event) => {
  electronLog.info('Checking for the app software updates call');
  if(!isDev){
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    electronLog.info('ups: Not checking for updates in dev mode');
  }
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
ipcMain.on('csv-data-sync', csvDataSync);
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
