const axios = require('axios');
const electron = require('electron');
const { app } = electron;
const Database = require('better-sqlite3');
const DB_NAME = 'foobar.db';
const path = require('path');
const { _url, SERVER_URL } = require('../constants');
const { update } = require('lodash');
const electronLog = require('electron-log');
const { convertCompilerOptionsFromJson } = require('typescript');

const SUBMISSION_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/submission/`;
const CSV_DATA_FETCH_ENDPOINT = `${SERVER_URL}/bhmodule/system-data-sync/core_admin/`;
const DATA_SYNC_COUNT = `${SERVER_URL}/bhmodule/form/core_admin/data-sync-count/`;
const DATA_SYNC_PAGINATED = `${SERVER_URL}/bhmodule/form/core_admin/data-sync-paginated/`;
const PAGE_LENGTH = 100;

const queries = `CREATE TABLE users( user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, macaddress TEXT, lastlogin TEXT NOT NULL, upazila INTEGER , role Text NOT NULL, branch  TEXT NOT NULL, organization  TEXT NOT NULL, name  TEXT NOT NULL, email  TEXT NOT NULL);
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
  electronLog.log('fetchCsvData call', username);
  try {
    const last_updated = db.prepare('SELECT time from csv_sync_log order by time desc limit 1').get();
    const updated = last_updated == undefined || last_updated.time == null ? 0 : last_updated.time;
    const url = _url(CSV_DATA_FETCH_ENDPOINT, username, updated);
    electronLog.log(url);
    await axios
      .get(url)
      .then((response) => {
        const newDataRows = response.data;
        newDataRows.forEach((newDataRow) => {
          // eslint-disable-next-line no-console
          if (newDataRow.data) {
            deleteCSVDataWithPk(db, newDataRow.primary_key, newDataRow, newDataRow.table_name);
            saveNewCSVDataToTable(db, newDataRow);
          }
        });
        const newLayoutQuery = db.prepare('INSERT INTO csv_sync_log(time) VALUES(?)');
        newLayoutQuery.run(Date.now());
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        electronLog.log('axios error', error);
        return 'failed';
      });
    return 'success';
  } catch (err) {
    // eslint-disable-next-line no-console
    electronLog.log('fetch err', err);
    return 'failed';
  }
};

/** deletes the entry from data table and related tables if exist
 * @param {string} pkList
 * @param {string} rowData
 */
const deleteCSVDataWithPk = (db, pkList, rowData, tableName) => {
  try {
    rowData.data.forEach((rowObj) => {
      let sqlWhereClause = `delete from ${rowData.table_name} where `;
      pkList.forEach((filterName) => {
        if (rowObj[filterName] !== '') {
          sqlWhereClause = `${sqlWhereClause} ${filterName} = ${rowObj[filterName]} and `;
        }
      });
      const dataDeleteStmt = sqlWhereClause !== '' ? sqlWhereClause.slice(0, -4) : '';
      // const dataDeleteStmt = db.prepare(query);
      console.log(dataDeleteStmt);
      db.prepare(dataDeleteStmt).run();
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
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
        values = `${values}@${filterName}, `
      }
    });
    let sqlWhereClause = `INSERT INTO ${rowData.table_name} (${keys.slice(0, -2)}) VALUES (${values.slice(0, -2)})`;
    const insertMany = db.transaction((rows) => {
      // console.log(geos);
      for (const row of rows)
        db.prepare(sqlWhereClause).run(row);
    });

    insertMany(rowData.data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
};


/** fetches data from server to app
 * @returns {string} - success if successful; otherwise, failed
 */
const fetchDataFromServer = async (db, username) => {
  console.log('XIM1 fetch call of the user', username);
  console.log('See database here', app.getPath("userData"));
  
  try {
    const last_updated = db.prepare('SELECT last_updated from data order by last_updated desc limit 1').get();
    const updated =
      last_updated == undefined || last_updated.last_updated == null
        ? 0
        : new Date(last_updated.last_updated).valueOf();
    const url = _url(DATA_SYNC_PAGINATED, username);
    const dataCountUrl = _url(DATA_SYNC_COUNT, username, updated);

    electronLog.info(`--------- || Data count URL ${dataCountUrl} || ------------------`);
    const dataSyncCountResponse = await axios.get(`${dataCountUrl}`);


    electronLog.info('---------- || Data Sync Started || -------------------');
    const dataLength = Array.isArray(dataSyncCountResponse.data) ? dataSyncCountResponse.data[0].count : dataSyncCountResponse.data.count;

    let promises = [];
    let serverCalls = [];
    for (let i = 1; i <= (dataLength / PAGE_LENGTH) + 1; i++) {
      promises.push(
        axios.get(`${url}&last_modified=${updated}&page_no=${i}&page_length=${PAGE_LENGTH}`).then((response) => {
          serverCalls.push(i);

          electronLog.info(`----------|| call ${i}: ${url}?last_modified=${updated}&page_no=${i}&page_length=${PAGE_LENGTH} ||------------------`);
          const newDataRows = response.data;
          newDataRows.forEach((newDataRow) => {
            // eslint-disable-next-line no-console
            //console.log(newDataRow.id); //jesus f christ
            
            //someone went mad here:
            // deleteDataWithInstanceId(db, newDataRow.id.toString(), newDataRow.xform_id);
            saveNewDataToTable(db, newDataRow.id.toString(), newDataRow.xform_id, newDataRow.json);
          });

          electronLog.info('-------- || data saved into database || ------------');

        }).catch((err) => {

          console.log("error in data sync paginated ");
          console.log(err);
          electronLog.info("-------------- || Error in Data sync || -----------------");
          electronLog.info(` Error Occured In the response of this url: ${url}?last_modified=${updated}&page_no=${i}&page_length=${PAGE_LENGTH}`);
          electronLog.info(err);
        })
      );
    }

    await Promise.all(promises);
    console.log(serverCalls);
    electronLog.info(`--------|| total server call: ${serverCalls.length} `);
    electronLog.info('------- || Data Sync Complete || --------------');

    return 'success';
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('fetch err', err);
    electronLog.info('----------------|| Error In Fetching Data From Server || -------------------');
    electronLog.info(err);
    return 'failed';
  }
};

const deleteDataWithInstanceId = (db, instanceId, formId) => {
  electronLog.info(
    `----- || deleteDataWithInstanceID; instanceId: ${instanceId.toString()}; formId: ${formId} ||  -----`,
  );
  try {
    let sql = 'DELETE FROM data WHERE instanceid = ?';
    let stmt = db.prepare(sql);
    let numDeleted = stmt.run(instanceId.toString()).changes;
    console.log(`Row(s) deleted from table "data": ${numDeleted}`);
    if (numDeleted > 0) {
      const formDefinitionObj = db.prepare('SELECT * FROM forms WHERE form_id = ?').get(formId);
      const tableMapping = JSON.parse(formDefinitionObj.table_mapping);
      tableMapping.forEach((tableName) => {
        try {
          sql = `DELETE FROM ${tableName} WHERE instanceid = ?`;
          stmt = db.prepare(sql);
          numDeleted = stmt.run(instanceId.toString()).changes;
          console.log(`Row(s) deleted from table "${tableName}": ${numDeleted}`);
          electronLog.info(`----- || deleteDataWithInstanceID SUCCESS ||  -----`);
        } catch (err) {
          electronLog.info(`----- || deleteDataWithInstanceID FAILED ||  -----`);
          console.error(err);
        }
      });
    }
  } catch (err) {
    electronLog.info(`----- || deleteDataWithInstanceID FAILED ||  -----`);
    console.log(err);
  }
};

/** saves new data to table
 * @param {string} instanceId - the unique instance id
 * @param {string} formId - the unique form id
 * @param {object} userInput - the userinput object containing field values that need to be saved
 */
const saveNewDataToTable = (db, instanceId, formId, userInput) => {
  try {
    electronLog.info(`+++++ || saveNewDataToTable with submission time ${userInput._submission_time} || +++++`);
    const date = userInput._submission_time
      ? new Date(userInput._submission_time).toISOString()
      : new Date().toISOString();

    const insertStmt = db.prepare(
      `INSERT INTO data (form_id, data, status, instanceid, last_updated,submitted_by, submission_date) VALUES (?, ?, 1, ?, ?, ?, ?)`,
    );
    insertStmt.run(
      formId,
      JSON.stringify(userInput),
      instanceId,
      new Date().toISOString(),
      userInput._submitted_by,
      date,
    );

    // console.log('xform_id: '+userInput._xform_id_string);

    parseAndSaveToFlatTables(db, formId, JSON.stringify(userInput), instanceId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
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
  let columnNames = [];
  let fieldValues = [];
  const repeatKeys = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const key in tableObj) {
    if (possibleFieldNames.includes(key)) {
      current_entry = tableObj[key];
      current_entry_array = Array.isArray(current_entry);
      current_entry_nonzero = current_entry.length > 0;
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

  if (columnNames !== '' || repeatKeys.length > 0) {
    if (instanceId) {
      columnNames.push('instanceid');
      fieldValues.push(instanceId);
    }
    if (parentId) {
      columnNames.push(`${parentTableName.substring(6)}_id`);
      fieldValues.push(parentId);
    }
    actualTableName = `${tableName}_table`;
    actualColumns = columnNames;
    actualValues = fieldValues;
    lenFields = columnNames.length;
    sqliteplaceholder = ", ?".repeat(lenFields -1 );
    actualColumnsString = actualColumns.join(',');
    //betterSQLITE3 requires ? in place of values but column names and table name need to be defined at compilation time
    const query = 'INSERT INTO '.concat(actualTableName,'(', actualColumnsString, ' ) ', 'VALUES ', '(?', sqliteplaceholder, ' )');

    try {
      const successfulInsertprep = dbCon.prepare(query);
      const successfulInsert = successfulInsertprep.run(actualValues);
      newParentId = successfulInsert.lastInsertRowid;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('Insert failed !!!', err, query);
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
  console.log('send data', username);
  
  try {
    const notSyncRowsQuery = db.prepare('Select * from data where status = 0');
    const updateStatusQuery = db.prepare('UPDATE data SET status = 1, instanceid = ? WHERE data_id = ?');
    try {
      const notSyncRows = notSyncRowsQuery.all() || [];
      const noRowsToSync = notSyncRows.length;
      electronLog.info(`------- || SYNCING DATA, number of rows to sync ${noRowsToSync} || ----------------`);
      let noRowsSynced = 0;


      if (noRowsSynced == noRowsToSync) {
        mainWindow.send('dataSyncComplete', "no rows to sync");
      }

      derdelay = 500 //POST request getting to server at the same time make it lock. Introducing this delay at least we will not be blocking few requests of our own and over time synchronise all of the data
      notSyncRows.forEach(async (rowObj, index) => {

        const formDefinitionObj = db.prepare('Select * from forms where form_id = ?').get(rowObj.form_id);
        // eslint-disable-next-line no-unused-vars
        let formData = JSON.parse(rowObj.data) || {};
        formData = { ...formData, 'formhub/uuid': formDefinitionObj.form_uuid };
        //We are converting json to XML which is an alternative submission for xforms
        const apiFormData = {
          xml_submission_file: convertJsonToXml(formData, formDefinitionObj.form_name),
          // test_file: fs.readFileSync('set-up-queries.sql', 'utf8'),
          //test_file: queries,
        };

        const url = _url(SUBMISSION_ENDPOINT, username);
        const jsondata = JSON.stringify(apiFormData)
        console.log("url",url);
        console.log(url);
        console.log("jsondata",jsondata);
        console.log(jsondata);
       
        setTimeout(async function() {  
        await axios
          .post(url, jsondata, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': '*',
              'Content-Type': 'application/json',
            },
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.status === 201 || response.data.status === 201) {
              updateStatusQuery.run(response.data.id.toString(), rowObj.data_id);
              JSON.parse(formDefinitionObj.table_mapping).forEach((tableName) => {
                const updateDataIdQuery = db.prepare(`UPDATE ${tableName} SET instanceid = ? WHERE instanceid = ?`);
                updateDataIdQuery.run(response.data.id.toString(), JSON.parse(rowObj.data)['meta/instanceID']);
              });
            }

            electronLog.info(`------- || UFF GOT A RESPONSE NOW|| ----------------`);
            //YEAH I GET THAT THIS IS NOT GREAT FOR PARALLELISM BUT WHAT CAN I DO?
            noRowsSynced = noRowsSynced + 1;
            if (noRowsSynced == noRowsToSync){
              mainWindow.send('dataSyncComplete', "synchronised");
            }
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            electronLog.info(`----------------- || Datapoint submission failed!|| ----------------------------`, error);
          })
        }, index * derdelay);
      });
    } catch (err) {
      electronLog.info(`----------------- || Data submission failed!|| ----------------------------`, err);

      // eslint-disable-next-line no-console
      // console.log(err);
    }
    return 'success';
  } catch (err) {
    // eslint-disable-next-line no-console
    // console.log(err);
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
  let xmlString = "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>";
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
        // eslint-disable-next-line no-param-reassign
        mJsnObj[xPath[index]] = [];
      }
      xvalue.forEach((xvalueItem, xItemindex) => {
        Object.keys(xvalueItem).forEach((jsnKey) => {
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

/** transforms individual json key, value to xml attribute based on json value type
 * @param {string} xkey - json key
 * @param {any} xvalue - json value
 * @returns {string} - the transformed xml value
 */
const generateIndividualXml = (xkey, xvalue) => {
  const getObjKey = (value) => {
    let arr = value.split('/');
    return arr[arr.length - 1];
  }

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

module.exports = {
  fetchDataFromServer,
  sendDataToServer,
  parseAndSaveToFlatTables,
  queries,
  deleteDataWithInstanceId,
  fetchCsvDataFromServer
};
