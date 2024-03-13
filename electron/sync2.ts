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
const BAHIS2_CSV_DATA_FETCH_ENDPOINT = `${BAHIS2_SERVER_URL}/bhmodule/system-data-sync/core_admin/`;

// helper functions

const _url = (url, username, time) => {
    if (time !== null && time !== undefined) {
        return `${url.replace('core_admin', username)}?last_modified=${time}&bahis_desk_version=${APP_VERSION}`;
    } else {
        return `${url.replace('core_admin', username)}?bahis_desk_version=${APP_VERSION}`;
    }
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
