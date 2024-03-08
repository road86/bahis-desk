import { log } from './log';

export const initialiseDBTables = (db) => {
    initialiseDBModulesTable(db);
    initialiseDBWorkflowsTable(db);
    initialiseDBFormsTable(db);
    initialiseDBFormLocalDraftsTable(db);
    initialiseDBFormCloudSubmissionsTable(db);
    initialiseDBTaxonomiesTable(db);
    initialiseDBAdministrativeRegionsTable(db);
};

const initialiseDBModulesTable = (db) => {
    log.info('Creating module table');
    db.prepare(
        'CREATE TABLE module (\
        id INTEGER NOT NULL PRIMARY KEY,\
        title TEXT NOT NULL,\
        icon TEXT NULL,\
        description TEXT NULL,\
        form TEXT NULL,\
        external_url TEXT NULL,\
        sort_order INTEGER NOT NULL,\
        parent_module INTEGER NULL,\
        module_type INTEGER NOT NULL\
    );',
    ).run();
};

const initialiseDBWorkflowsTable = (db) => {
    log.info('Creating workflow table');
    db.prepare(
        'CREATE TABLE workflow (\
        id INTEGER NOT NULL PRIMARY KEY,\
        title TEXT NOT NULL,\
        source_form TEXT NULL,\
        destination_form TEXT NULL,\
        definition TEXT NOT NULL\
    );',
    ).run();
};

const initialiseDBFormsTable = (db) => {
    log.info('Creating form table');
    db.prepare(
        'CREATE TABLE form (\
        uid TEXT NOT NULL PRIMARY KEY,\
        name TEXT NOT NULL,\
        description TEXT NULL,\
        xml TEXT NOT NULL\
    );',
    ).run();
};

const initialiseDBFormLocalDraftsTable = (db) => {
    log.info('Creating formlocaldraft table');
    db.prepare(
        'CREATE TABLE formlocaldraft (\
        uuid TEXT NOT NULL PRIMARY KEY,\
        form_uid TEXT NOT NULL,\
        xml TEXT NULL\
    );',
    ).run();
};

const initialiseDBFormCloudSubmissionsTable = (db) => {
    log.info('Creating formcloudsubmission table');
    db.prepare(
        'CREATE TABLE formcloudsubmission (\
        uuid TEXT NOT NULL PRIMARY KEY,\
        form_uid TEXT NOT NULL,\
        xml TEXT NOT NULL\
    );',
    ).run();
};

const initialiseDBTaxonomiesTable = (db) => {
    log.info('Creating taxonomy table');
    db.prepare(
        'CREATE TABLE taxonomy (\
        slug TEXT NOT NULL PRIMARY KEY,\
        csv_file TEXT NOT NULL\
    );',
    ).run();
};

const initialiseDBAdministrativeRegionsTable = (db) => {
    log.info('Creating administrativeregionlevel table');
    db.prepare(
        'CREATE TABLE administrativeregionlevel (\
        id INTEGER NOT NULL PRIMARY KEY,\
        title TEXT NOT NULL\
    );',
    ).run();

    log.info('Creating administrativeregion table');
    db.prepare(
        'CREATE TABLE administrativeregion (\
        id INTEGER NOT NULL PRIMARY KEY,\
        title TEXT NOT NULL,\
        parent_administrative_region INTEGER,\
        administrative_region_level INTEGER NOT NULL\
    );',
    ).run();
};
