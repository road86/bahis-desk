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
            const newLayoutQuery = db.prepare('INSERT INTO app2 (app_id, app_name, definition) VALUES(1, ?,?)');
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
                const layoutDeleteQuery = db.prepare('DELETE FROM app2');

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

// form choice definitions
export const getFormChoices2 = async (username, time, db) => {
    log.info(`Synchronising forms (time: ${time})`);
    log.info(`api url: ${_url(BAHIS2_FORM_CHOICE_ENDPOINT, username, time)}`);

    await axios.get(_url(BAHIS2_FORM_CHOICE_ENDPOINT, username, time)).then((formChoice) => {
        if (formChoice.data) {
            log.info(`  formChoice data (time: ${time}; total: ${formChoice.data.length}) `);
            const previousFormChoices = db.prepare(
                'DELETE FROM form_choices2 WHERE value_text = ? and field_name = ? and xform_id = ? ',
            );

            const insertQuery = db.prepare(
                'INSERT INTO form_choices2 ( value_text, xform_id, value_label, field_name, field_type) VALUES(?,?,?,?,?)',
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
                `INSERT INTO data2 (form_id, data, status, instanceid, last_updated, submitted_by, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
        const last_updated = db.prepare('SELECT last_updated from data2 order by last_updated desc limit 1').get() as any;
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
