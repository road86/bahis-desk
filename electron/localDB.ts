import log from 'electron-log';

export const initialiseDBTables = (db) => {
    initialiseDBModulesTable(db);
    initialiseDBWorkflowsTable(db);
    initialiseDBFormsTable(db);
    initialiseDBTaxonomiesTable(db);
    initialiseDBAdministrativeRegionsTable(db);
};

export const initialiseDBModulesTable = (db) => {
    log.info('Creating module table');
    db.prepare(
        'CREATE TABLE module (\
        id INTEGER NOT NULL PRIMARY KEY,\
        title TEXT NOT NULL,\
        icon TEXT NULL,\
        description TEXT NULL,\
        form INTEGER NULL,\
        external_url TEXT NULL,\
        sort_order INTEGER NOT NULL,\
        parent_module INTEGER NULL,\
        module_type INTEGER NOT NULL\
    );',
    ).run();
};

export const initialiseDBWorkflowsTable = (db) => {
    log.info('Creating workflow table');
    db.prepare(
        'CREATE TABLE workflow (\
        id INTEGER NOT NULL PRIMARY KEY,\
        title TEXT NOT NULL,\
        source_form INTEGER NULL,\
        destination_form INTEGER NULL,\
        definition TEXT NOT NULL\
    );',
    ).run();
};

export const initialiseDBFormsTable = (db) => {
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

export const initialiseDBTaxonomiesTable = (db) => {
    log.info('Creating taxonomy table');
    db.prepare(
        'CREATE TABLE taxonomy (\
        slug TEXT NOT NULL PRIMARY KEY,\
        csv_file TEXT NOT NULL\
    );',
    ).run();
};

export const initialiseDBAdministrativeRegionsTable = (db) => {
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
        parent_administrative_region INTEGER NOT NULL,\
        administrative_region_level INTEGER NOT NULL\
    );',
    ).run();
};
