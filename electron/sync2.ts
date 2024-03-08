// All functions used for synchronization between electron and bahis-serve (v2)
// This file is used by electron/main.ts
// Each function is called by the final function `sync2()`

import axios from 'axios';
import { app } from 'electron';
import { random } from 'lodash';
import { log } from './log';

// variables
export const APP_VERSION = app.getVersion();
export const BAHIS2_SERVER_URL = import.meta.env.VITE_BAHIS2_SERVER_URL || 'http://localhost:80';

const BAHIS2_APP_DEFINITION_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/core_admin/get-api/module-list/`;
const BAHIS2_CATCHMENT_DEFINITION_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/core_admin/get-api/catchment-list/`;
const BAHIS2_FORMS_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/core_admin/get-api/form-list/`;
const BAHIS2_LISTS_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/core_admin/get-api/list-def/`;
const BAHIS2_FORM_CHOICE_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/core_admin/get-api/form-choices/`;
const BAHIS2_SUBMISSION_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/core_admin/submission/`;
const BAHIS2_DATA_SYNC_COUNT = `${BAHIS2_SERVER_URL}/bhmodule/form/core_admin/data-sync-count/`;
const BAHIS2_DATA_SYNC_PAGINATED = `${BAHIS2_SERVER_URL}/bhmodule/form/core_admin/data-sync-paginated/`;
const PAGE_LENGTH = 100;
const BAHIS2_CSV_DATA_FETCH_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/system-data-sync/core_admin/`;

// helper functions

const _url = (url, username, time) => {
    if (time !== null && time !== undefined) {
        return `${url.replace('core_admin', username)}?last_modified=${time}&bahis_desk_version=${APP_VERSION}`;
    } else {
        return `${url.replace('core_admin', username)}?bahis_desk_version=${APP_VERSION}`;
    }
};

export const deleteDataWithInstanceId2 = (db, instanceId, formId) => {
    log.info(`deleteDataWithInstanceID; instanceId: ${instanceId.toString()}; formId: ${formId}`);
    try {
        let sql = 'DELETE FROM data WHERE instanceid = ?';
        let stmt = db.prepare(sql);
        let numDeleted = stmt.run(instanceId.toString()).changes;
        log.info(`Row(s) deleted from table "data": ${numDeleted}`);
        if (numDeleted > 0) {
            const formDefinitionObj = db.prepare('SELECT * FROM forms2 WHERE id = ?').get(formId);
            const tableMapping = JSON.parse(formDefinitionObj.table_mapping);
            tableMapping.forEach((tableName) => {
                try {
                    sql = `DELETE FROM ${tableName} WHERE instanceid = ?`;
                    stmt = db.prepare(sql);
                    numDeleted = stmt.run(instanceId.toString()).changes;
                    log.info(`Row(s) deleted from table "${tableName}": ${numDeleted}`);
                    log.info('deleteDataWithInstanceID SUCCESS');
                } catch (error) {
                    log.info('deleteDataWithInstanceID FAILED');
                    log.error(error);
                }
            });
        }
    } catch (error) {
        log.info('deleteDataWithInstanceID FAILED');
        log.error(error);
    }
};

export const parseAndSaveToFlatTables2 = (db, formId, userInput, instanceId) => {
    const objToTable = (
        db,
        tableName,
        parentTableName,
        tableObj,
        instanceId,
        parentId,
        lastRepeatKeyName,
        possibleFieldNames,
    ) => {
        const columnNames: string[] = [];
        const fieldValues: any[] = [];
        const repeatKeys: string[] = [];
        for (const key in tableObj) {
            if (possibleFieldNames.includes(key)) {
                const current_entry = tableObj[key];
                const current_entry_array = Array.isArray(current_entry);
                const current_entry_nonzero = current_entry !== null && current_entry.length > 0;
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

        if (columnNames.length > 0 || repeatKeys.length > 0) {
            if (instanceId) {
                columnNames.push('instanceid');
                fieldValues.push(instanceId);
            }
            if (parentId) {
                columnNames.push(`${parentTableName.substring(6)}_id`);
                fieldValues.push(parentId);
            }
            const actualTableName = `${tableName}_table`;
            const actualColumns = columnNames;
            const actualValues = fieldValues;
            const lenFields = columnNames.length;
            const sqliteplaceholder = ', ?'.repeat(lenFields - 1);
            const actualColumnsString = actualColumns.join(',');
            const query = 'INSERT INTO '.concat(
                actualTableName,
                '(',
                actualColumnsString,
                ' ) ',
                'VALUES ',
                '(?',
                sqliteplaceholder,
                ' )',
            );

            try {
                const successfulInsertprep = db.prepare(query);
                const successfulInsert = successfulInsertprep.run(actualValues);
                newParentId = successfulInsert.lastInsertRowid;
            } catch (error) {
                log.error('Insert failed !!!');
                log.error(error);
                log.debug(query);
            }
        }
        repeatKeys.forEach((key) => {
            tableObj[key].forEach((elm) => {
                objToTable(
                    db,
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

    const formObj = db.prepare('SELECT * from forms2 where id = ? limit 1').get(formId);
    if (formObj !== undefined) {
        const formDefinition = JSON.parse(formObj.json);
        const formFieldNames = JSON.parse(formObj.field_names);
        const userInputObj = JSON.parse(userInput);
        objToTable(
            db,
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

// sync functions

// desktop app module definitions
export const getModuleDefinitions2 = async (username, time, db) => {
    log.info(`Synchronising Modules (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_APP_DEFINITION_ENDPOINT, username, time)}`);

    const updateModuleDefinitions = (appDefinition, db) => {
        log.info('updateModuleDefinitions');
        log.info(JSON.stringify(appDefinition.name));
        const update = function (module) {
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
                    list_id: '',
                    type: 'form',
                    id: module.id,
                };
                const listId = random(100, 200);
                const listModule = {
                    xform_id: module.xform_id,
                    name: 'module_' + listId,
                    img_id: '',
                    children: [],
                    label: {
                        Bangla: 'Submitted Data',
                        English: 'Submitted Data',
                    },
                    catchment_area: module.catchment_area,
                    list_id: '',
                    type: 'form_list',
                    id: listId,
                };
                module.xform_id = '';
                module.name = 'module_' + listId;
                module.img_id = '';
                //  module.childre = {
                //    formModule,
                //    listModule
                //  }
                module.children.push(formModule);
                module.children.push(listModule);
                module.type = 'container';
                module.id = listId;
            } else if (module.children)
                module.children.forEach((mod) => {
                    update(mod);
                });
        };

        appDefinition.children.forEach((definition) => {
            update(definition);
        });

        try {
            const newLayoutQuery = db.prepare('INSERT INTO app(app_id, app_name, definition) VALUES(1, ?,?)');
            newLayoutQuery.run('Bahis_Updated', JSON.stringify(appDefinition));
        } catch (error) {
            log.error(error);
        }
        log.info('updateModuleDefinitions FINISHED');
    };

    axios
        .get(_url(BAHIS2_APP_DEFINITION_ENDPOINT, username, time))
        .then((moduleListRes) => {
            if (moduleListRes.data) {
                log.info('moduleListRes data');
                const layoutDeleteQuery = db.prepare('DELETE FROM app');

                try {
                    log.info('clearing app layout');
                    layoutDeleteQuery.run();
                } catch (error) {
                    log.info('Previous Layout does not exist');
                    log.error(error);
                }
                updateModuleDefinitions(moduleListRes.data, db);
            }
            log.info('Synchronising Modules SUCCESS');
        })
        .catch((error) => {
            log.info('Synchronising Modules FAIL \n', error);
        });
};

// catchment definitions
export const getCatchments2 = async (username, time, db) => {
    log.info(`Synchronising Catchments (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_CATCHMENT_DEFINITION_ENDPOINT, username, time)}`);

    const updateCatchments = (catchments, db) => {
        log.info(`updateCatchments: ${catchments.length}`);
        db.prepare('DELETE FROM geo_cluster').run();
        const geoData = catchments ? catchments : [];
        if (geoData.length) {
            const insertStmt = db.prepare(
                `INSERT INTO geo_cluster (value, name, loc_type , parent) VALUES (@value, @name, @loc_type, @parent)`,
            );

            const insertMany = db.transaction((geos) => {
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

    await axios
        .get(_url(BAHIS2_CATCHMENT_DEFINITION_ENDPOINT, username, time))
        .then((catchmentListRes) => {
            if (catchmentListRes.data) {
                log.info('catchmentListRes data');
                updateCatchments(catchmentListRes.data, db);
            }

            log.info('Synchronising Catchments SUCCESS');
        })
        .catch((error) => {
            log.error('Synchronising Catchments FAILED with:');
            log.error(error);
        });
};

// form configs
export const getFormConfig2 = async (username, time, db) => {
    const formConfigEndpoint = (username, time) => {
        return (
            `${BAHIS2_SERVER_URL}/bhmodule/core_admin/get/form-config/?/`.replace('?', time).replace('core_admin', username) +
            `?bahis_desk_version=${APP_VERSION}`
        );
    };

    log.info(`Synchronising FormConfig (time: ${time})`);
    log.info(`api url: ${formConfigEndpoint(username, time)}`);

    await axios.get(`${formConfigEndpoint(username, time)}`).then((formConfigRes) => {
        if (formConfigRes.data) {
            log.info('formConfigRes data');
            formConfigRes.data.forEach((sqlObj) => {
                if (sqlObj.sql_script) {
                    try {
                        db.exec(sqlObj.sql_script);
                    } catch (error: any) {
                        log.error('formConfigRes FAILED with:');
                        log.error(error);
                    }
                }
            });
            log.info('formConfigRes SUCCESS');
        }
    });
};

// form definitions
export const getForms2 = async (username, time, db) => {
    log.info(`Synchronising Forms (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_FORMS_ENDPOINT, username, time)}`);

    const extractPossibleFieldNames = (xformJSON) => {
        const parseFieldNames = (parentName, possibleNames, currentFormJsn) => {
            currentFormJsn.forEach((currentElem) => {
                switch (currentElem.type) {
                    case 'group':
                    case 'repeat':
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
                        possibleNames.push(parentName + currentElem.name);
                        break;
                    default:
                        break;
                }
            });
        };

        const possibleNames = [];
        parseFieldNames('', possibleNames, xformJSON.children);
        return possibleNames;
    };

    await axios.get(_url(BAHIS2_FORMS_ENDPOINT, username, time)).then((formListRes) => {
        if (formListRes.data) {
            log.info(` FormListRes data (time: ${time}; total: ${formListRes.data.length}) `);
            const previousFormDeletionQuery = db.prepare('DELETE FROM forms2 WHERE id = ?');
            const newFormInsertionQuery = db.prepare(
                'INSERT INTO forms2(id, id_string, xml, json, choice_definition, uuid, table_mapping, field_names) VALUES(?,?,?,?,?,?,?,?)',
            );
            formListRes.data.forEach(async (formObj) => {
                try {
                    previousFormDeletionQuery.run(formObj.id);
                } catch (error) {
                    log.info('Deletion Failed ! Previous form not exists!!');
                }
                const fieldNames = extractPossibleFieldNames(formObj.json);
                try {
                    newFormInsertionQuery.run(
                        formObj.id,
                        formObj.id_string,
                        formObj.xml,
                        JSON.stringify(formObj.json),
                        JSON.stringify(formObj.choice_list),
                        formObj.uuid,
                        JSON.stringify(formObj.table_mapping),
                        JSON.stringify(fieldNames),
                    );
                } catch (error) {
                    log.error('db form insertion FAILED with:');
                    log.error(error);
                }
            });
        }
    });
};

// list definitions
export const getLists2 = async (username, time, db) => {
    log.info(`Synchronising Forms (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_LISTS_ENDPOINT, username, time)}`);

    await axios.get(_url(BAHIS2_LISTS_ENDPOINT, username, time)).then((listRes) => {
        if (listRes.data) {
            log.info(` ListRes data (time: ${time}; total: ${listRes.data.length}) `);
            const previousListDeletionQuery = db.prepare('DELETE FROM lists WHERE list_id = ?');
            const newListInsertQuery = db.prepare(
                'INSERT INTO lists(list_id, list_name, list_header, datasource, filter_definition, column_definition) VALUES(?,?,?,?,?,?)',
            );
            listRes.data.forEach((listObj) => {
                try {
                    previousListDeletionQuery.run(listObj.id);
                } catch (error) {
                    log.info('Deletion Failed ! Previous list not exists!!');
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
                } catch (error) {
                    log.error('db list insertion FAILED with:');
                    log.error(error);
                }
            });
        }
    });
};

// form choice definitions
export const getFormChoices2 = async (username, time, db) => {
    log.info(`Synchronising forms (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_FORM_CHOICE_ENDPOINT, username, time)}`);

    await axios.get(_url(BAHIS2_FORM_CHOICE_ENDPOINT, username, time)).then((formChoice) => {
        if (formChoice.data) {
            log.info(`  formChoice data (time: ${time}; total: ${formChoice.data.length}) `);
            const previousFormChoices = db.prepare(
                'DELETE FROM form_choices WHERE value_text = ? and field_name = ? and xform_id = ? ',
            );

            const insertQuery = db.prepare(
                'INSERT INTO form_choices( value_text, xform_id, value_label, field_name, field_type) VALUES(?,?,?,?,?)',
            );

            log.info('total form choice data');
            log.info(formChoice.data.length);

            formChoice.data.forEach(async (formObj) => {
                try {
                    previousFormChoices.run(formObj.value_text, formObj.field_name, formObj.xform_id);
                } catch (error) {
                    log.error('db form_choice deletion FAILED with:');
                    log.error(error);
                }

                try {
                    insertQuery.run(
                        formObj.value_text,
                        String(formObj.xform_id),
                        formObj.value_label,
                        formObj.field_name,
                        formObj.field_type,
                    );
                } catch (error) {
                    log.error('db form_choice insertion FAILED with:');
                    log.error(error);
                }
            });
        }
    });
};

// post form submissions
export const postFormSubmissions2 = async (username, time, db) => {
    log.info(`Synchronising submitted forms (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_SUBMISSION_ENDPOINT, username, time)}`);

    const generateIndividualXml = (xkey, xvalue) => {
        const handleXmlInvalidEntries = (affectedString) => {
            let tmpString = affectedString;
            tmpString = tmpString.replace('&', '&amp;');
            tmpString = tmpString.replace('<', '&lt;');
            tmpString = tmpString.replace('>', '&gt;');
            return tmpString;
        };

        const getObjKey = (value) => {
            const arr = value.split('/');
            return arr[arr.length - 1];
        };

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

    const convertJsonToXml = (jsnObj, formIdString) => {
        const assignJsnValue = (mJsnObj, xPath, index, xvalue) => {
            const isNotArrayOfString = (testArray) => {
                let isObjectFound = false;
                testArray.forEach((arrElm) => {
                    if (typeof arrElm === 'object') {
                        isObjectFound = true;
                    }
                });
                return isObjectFound;
            };

            if (index === xPath.length - 1) {
                if (Array.isArray(xvalue) && isNotArrayOfString(xvalue)) {
                    if (!(xPath[index] in mJsnObj)) {
                        mJsnObj[xPath[index]] = [];
                    }
                    xvalue.forEach((xvalueItem, xItemindex) => {
                        Object.keys(xvalueItem).forEach((jsnKey) => {
                            const jsnPath = jsnKey.split('/');
                            if (!mJsnObj[xPath[index]][xItemindex]) {
                                mJsnObj[xPath[index]][xItemindex] = {};
                            }
                            assignJsnValue(mJsnObj[xPath[index]][xItemindex], jsnPath, index + 1, xvalueItem[jsnKey]);
                        });
                    });
                } else {
                    mJsnObj[xPath[index]] = xvalue;
                }
                return;
            }
            if (!(xPath[index] in mJsnObj)) {
                mJsnObj[xPath[index]] = {};
                assignJsnValue(mJsnObj[xPath[index]], xPath, index + 1, xvalue);
            } else {
                assignJsnValue(mJsnObj[xPath[index]], xPath, index + 1, xvalue);
            }
        };

        const modifiedJsnObj = {};
        Object.keys(jsnObj).forEach((jsnKey) => {
            const jsnPath = jsnKey.split('/');
            assignJsnValue(modifiedJsnObj, jsnPath, 0, jsnObj[jsnKey]);
        });
        let xmlString = '<?xml version="1.0" encoding="UTF-8" ?>';
        xmlString += `<${formIdString} id="${formIdString}">`;
        Object.keys(modifiedJsnObj).forEach((mkey) => {
            xmlString += generateIndividualXml(mkey, modifiedJsnObj[mkey]);
        });
        xmlString += `</${formIdString}>`;
        return xmlString;
    };

    try {
        const notSyncRowsQuery = db.prepare('Select * from data where status = 0');
        const updateStatusQuery = db.prepare('UPDATE data SET status = 1, instanceid = ? WHERE data_id = ?');
        try {
            const notSyncRows = notSyncRowsQuery.all() || [];
            const noRowsToSync = notSyncRows.length;
            log.info(`SYNCING DATA, number of rows to sync ${noRowsToSync}`);
            const url = _url(BAHIS2_SUBMISSION_ENDPOINT, username, time);

            //send data to the server row by row
            const sendRow = async (rowObj) => {
                const formDefinitionObj = db.prepare('Select * from forms2 where id = ?').get(rowObj.form_id);
                let formData = JSON.parse(rowObj.data) || {};
                formData = { ...formData, 'formhub/uuid': formDefinitionObj.uuid };
                //We are converting json to XML which is an alternative submission for xforms
                const apiFormData = {
                    xml_submission_file: convertJsonToXml(formData, formDefinitionObj.name),
                };

                const jsondata = JSON.stringify(apiFormData);
                log.info('url', url);

                try {
                    const response = await axios.post(url, jsondata, {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                            'Access-Control-Allow-Headers': '*',
                            'Content-Type': 'application/json',
                        },
                    });
                    if (response.data.status === 201 || response.data.status === 201) {
                        deleteDataWithInstanceId2(db, JSON.parse(rowObj.data)['meta/instanceID'], rowObj.form_id);
                        updateStatusQuery.run(response.data.id.toString(), rowObj.data_id);
                        JSON.parse(formDefinitionObj.table_mapping).forEach((tableName) => {
                            const updateDataIdQuery = db.prepare(`UPDATE ${tableName}
                                                                  SET instanceid = ?
                                                                  WHERE instanceid = ?`);
                            updateDataIdQuery.run(response.data.id.toString(), JSON.parse(rowObj.data)['meta/instanceID']);
                        });
                    }
                    return true;
                } catch {
                    log.error('Datapoint submission FAILED with:');
                    log.error('error');
                    return jsondata;
                }
            };

            // send new data asynchronous way
            const sendNewData = async () => {
                for (let i = 0; i < notSyncRows.length; i++) {
                    log.info('Send no: ' + i);
                    await sendRow(notSyncRows[i]);
                }
            };

            await sendNewData()
                .then(() => {
                    log.info('submit finished all');
                })
                .catch(() => {
                    log.error('Failed to submit all');
                });
        } catch (error) {
            log.info('Data submission failed!');
        }
        return 'success';
    } catch (error) {
        return 'failed';
    }
};

// get form submissions
export const getFormSubmissions2 = async (username, time, db) => {
    log.info(`Synchronising submitted forms (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_SUBMISSION_ENDPOINT, username, time)}`);

    const saveNewDataToTable = (db, instanceId, formId, userInput) => {
        try {
            const date = userInput._submission_time
                ? new Date(userInput._submission_time).toISOString()
                : new Date().toISOString();

            const insertStmt = db.prepare(
                `INSERT INTO data (form_id, data, status, instanceid, last_updated, submitted_by, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            );
            insertStmt.run(
                formId,
                JSON.stringify(userInput),
                1,
                instanceId,
                new Date().toISOString(),
                userInput._submitted_by,
                date,
            );

            parseAndSaveToFlatTables2(db, formId, JSON.stringify(userInput), instanceId);
        } catch (error) {
            log.info('Save New Data To Table');
        }
    };

    try {
        const last_updated = db.prepare('SELECT last_updated from data order by last_updated desc limit 1').get() as any;
        const updated =
            last_updated == undefined || last_updated.last_updated == null ? 0 : new Date(last_updated.last_updated).valueOf();
        const url = _url(BAHIS2_DATA_SYNC_PAGINATED, username, updated);
        const dataCountUrl = _url(BAHIS2_DATA_SYNC_COUNT, username, updated);

        log.info(`Data count URL ${dataCountUrl}`);
        const dataSyncCountResponse = await axios.get(`${dataCountUrl}`);

        log.info('Data Sync Started');
        const dataLength = Array.isArray(dataSyncCountResponse.data)
            ? dataSyncCountResponse.data[0].count
            : dataSyncCountResponse.data.count;

        const maxRetries = 5;
        let tries = 1;
        const pageUrls: string[] = [];
        const serverCalls: number[] = [];

        //get list of axios promise from urls
        const getPromiseAll = (urls) => {
            const promises: Promise<any>[] = [];
            urls.forEach((pageUrl, i) => {
                promises.push(
                    axios
                        .get(pageUrl)
                        .then((response) => {
                            serverCalls.push(i + 1);

                            log.info(`call ${i + 1}: ${pageUrl}`);
                            const newDataRows = response.data;
                            newDataRows.forEach((newDataRow) => {
                                saveNewDataToTable(db, newDataRow.id.toString(), newDataRow.xform_id, newDataRow.json);
                            });

                            log.info('data saved into database');

                            return true;
                        })
                        .catch(() => {
                            log.info('Error in Data sync');
                            log.info(`Error Occurred In the response of this url: ${pageUrl}`);
                            return pageUrl;
                        }),
                );
            });

            return promises;
        };

        // calling all the promise and check failed request and retrying for failed request
        const callPromiseAll = async (promises) => {
            await Promise.all(promises).then((data) => {
                log.info(data);
                const failedReq = data.filter((val) => {
                    return val !== true && typeof val == 'string';
                });

                log.error('Failed request: ', failedReq);

                if (failedReq.length > 0 && tries <= maxRetries) {
                    // giving 1 sec delay for each tries
                    setTimeout(async () => {
                        log.info(`tries ${tries}`);
                        await callPromiseAll(getPromiseAll(failedReq));
                    }, 1000);
                    tries++;
                }
            });
        };

        // generate the page url from data length
        for (let i = 1; i <= dataLength / PAGE_LENGTH + 1; i++) {
            const pageUrl = `${url}&last_modified=${updated}&page_no=${i}&page_length=${PAGE_LENGTH}`;
            pageUrls.push(pageUrl);
        }

        const promises = getPromiseAll(pageUrls);

        await callPromiseAll(promises);

        log.info(serverCalls);
        log.info(`total server call: ${serverCalls.length}`);
        log.info('Data Sync Complete');

        return 'success';
    } catch (error) {
        log.error('Error In Fetching Data From Server');
        log.error(error);
        return 'failed';
    }
};

// CSV data
export const getCSVData2 = async (username, time, db) => {
    log.info(`Synchronising submitted forms (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_CSV_DATA_FETCH_ENDPOINT, username, time)}`);

    const fetchCsvDataFromServer = async (username, time, db) => {
        const deleteCSVDataWithPk = (db, pkList, rowData) => {
            try {
                rowData.data.forEach((rowObj) => {
                    let sqlWhereClause = `delete from ${rowData.table_name} where `;
                    pkList.forEach((filterName) => {
                        if (rowObj[filterName] !== '') {
                            sqlWhereClause = `${sqlWhereClause} ${filterName} = ${rowObj[filterName]} and `;
                        }
                    });
                    const dataDeleteStmt = sqlWhereClause !== '' ? sqlWhereClause.slice(0, -4) : '';
                    log.info(dataDeleteStmt);
                    db.prepare(dataDeleteStmt).run();
                });
            } catch (error) {
                log.error(error);
            }
        };

        const saveNewCSVDataToTable = (db, rowData) => {
            try {
                let keys = '';
                let values = '';
                Object.keys(rowData.data[0]).forEach((filterName) => {
                    if (rowData.data[filterName] !== '') {
                        keys = `${keys}${filterName}, `;
                        values = `${values}@${filterName}, `;
                    }
                });
                const sqlWhereClause = `INSERT INTO ${rowData.table_name} (${keys.slice(0, -2)}) VALUES (${values.slice(0, -2)})`;
                const insertMany = db.transaction((rows) => {
                    for (const row of rows) db.prepare(sqlWhereClause).run(row);
                });

                insertMany(rowData.data);
            } catch (error) {
                log.error(error);
            }
        };

        await axios
            .get(_url(BAHIS2_CSV_DATA_FETCH_ENDPOINT, username, time))
            .then((response) => {
                if (response.data) {
                    response.data.forEach((newDataRow) => {
                        if (newDataRow.data) {
                            deleteCSVDataWithPk(db, newDataRow.primary_key, newDataRow);
                            saveNewCSVDataToTable(db, newDataRow);
                        }
                    });
                }
            })
            .catch((error) => {
                log.error('axios error:');
                log.error(error);
                return 'failed';
            });
        return 'success';
    };

    try {
        const tableExistStmt = 'SELECT name FROM sqlite_master WHERE type=? AND name=?';
        const csvInfo = db.prepare(tableExistStmt).get('table', 'csv_sync_log');
        if (csvInfo && csvInfo.name == 'csv_sync_log') {
            await fetchCsvDataFromServer(username, time, db);
        } else {
            log.info('I think that csv_sync_log table does not exist so I will create it');
            db.prepare('CREATE TABLE csv_sync_log( time TEXT)').run();
            await fetchCsvDataFromServer(username, time, db);
        }
        log.info('csvDataSync  SUCCESS');
        return 'success';
    } catch (error) {
        log.info('csvDataSync FAILED');
        log.error(error);
        return 'failed';
    }
};
