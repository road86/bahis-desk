import { app } from 'electron';
import log from 'electron-log';
import axios from 'axios';
import { existsSync, writeFileSync, mkdirSync } from 'fs';

export const APP_VERSION = app.getVersion();
export const BAHIS_SERVER_URL = import.meta.env.VITE_BAHIS_SERVER_URL || 'http://localhost:3001';
log.info(`BAHIS_SERVER_URL=${BAHIS_SERVER_URL} (BAHIS 3)`);

const _url = (url, time?) => {
    let conjunction = '?';
    if (url.includes('?')) {
        conjunction = '&';
    }

    if (time !== null && time !== undefined) {
        return `${url}${conjunction}last_modified=${time}&bahis_desk_version=${APP_VERSION}`;
    } else {
        return `${url}${conjunction}bahis_desk_version=${APP_VERSION}`;
    }
};

export const getModules = async (db) => {
    log.info(`GET Module Definitions`);

    const BAHIS_MODULE_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/api/desk/modules`;
    const api_url = _url(BAHIS_MODULE_DEFINITION_ENDPOINT);
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of the user's role
    // FIXME this API endpoint needs to take care of auth

    axios
        .get(api_url)
        .then((response) => {
            if (response.data) {
                log.info('Modules received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO module (id, title, icon, description, form, external_url, sort_order, parent_module, module_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, icon = excluded.icon, description = excluded.description, form = excluded.form, external_url = excluded.external_url, sort_order = excluded.sort_order, parent_module = excluded.parent_module, module_type = excluded.module_type;',
                );
                const deleteQuery = db.prepare('DELETE FROM module WHERE id = ?');

                for (const module of response.data) {
                    if (module.is_active) {
                        upsertQuery.run([
                            module.id,
                            module.title,
                            module.icon,
                            module.description,
                            module.form,
                            module.external_url,
                            module.sort_order,
                            module.parent_module,
                            module.module_type,
                        ]);
                    } else {
                        log.info(`Deleting module ${module.id} from local database as no longer active`);
                        deleteQuery.run([module.id]);
                    }
                }
            }
            log.info('GET Module Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET Module Definitions FAILED with\n', error?.message);
        });
};

export const getWorkflows = async (db) => {
    log.info(`GET Workflow Definitions`);

    const BAHIS_WORKFLOW_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/api/desk/workflows`;
    const api_url = _url(BAHIS_WORKFLOW_DEFINITION_ENDPOINT);
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of auth

    axios
        .get(api_url)
        .then((response) => {
            if (response.data) {
                log.info('Workflows received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO workflow (id, title, source_form, destination_form, definition) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, definition = excluded.definition;',
                );
                const deleteQuery = db.prepare('DELETE FROM workflow WHERE id = ?');

                for (const workflow of response.data) {
                    if (workflow.is_active) {
                        upsertQuery.run([
                            workflow.id,
                            workflow.title,
                            workflow.source_form,
                            workflow.destination_form,
                            JSON.stringify(workflow.definition),
                        ]);
                    } else {
                        log.info(`Deleting workflow ${workflow.id} from local database as no longer active`);
                        deleteQuery.run([workflow.id]);
                    }
                }
            }
            log.info('GET Workflow Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET Workflow Definitions FAILED with\n', error?.message);
        });
};

export const getForms = async (db) => {
    log.info(`GET KoboToolbox Form Definitions`);

    const BAHIS_KOBOTOOLBOX_API_ENDPOINT = 'https://kf.kobotoolbox.org/api/v2/';
    log.info(`KOBOTOOLBOX API URL: ${BAHIS_KOBOTOOLBOX_API_ENDPOINT}`);
    const axios_config = {
        headers: {
            Authorization: `Token ${import.meta.env.VITE_KOBO_API_TOKEN}`,
        },
    };
    // FIXME this API endpoint needs to take care of auth in a dynamic fashion

    log.info('GET Form UIDs from KoboToolbox');
    const formList = await axios
        .get(BAHIS_KOBOTOOLBOX_API_ENDPOINT + 'assets', axios_config)
        .then((response) => {
            const formList = response.data.results
                .filter((asset) => asset.has_deployment)
                .map((asset) => ({
                    uid: asset.uid,
                    name: asset.name,
                    description: asset.settings.description,
                    xml_url: asset.downloads
                        .filter((download) => download.format === 'xml')
                        .map((download) => download.url)[0],
                }));
            log.info(`GET Form UIDs SUCCESS`);
            return formList;
        })
        .catch((error) => {
            log.warn('GET KoboToolbox Form Definitions FAILED with\n', error?.message);
        });

    const upsertQuery = db.prepare(
        'INSERT INTO form (uid, name, description, xml) VALUES (?, ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET xml = excluded.xml;',
    );
    for (const form of formList) {
        log.info(`GET form ${form.uid} from KoboToolbox`);
        log.debug(form.xml_url);
        axios
            .get(form.xml_url, axios_config)
            .then((response) => {
                const deployment = response.data;
                upsertQuery.run([form.uid, form.name, form.description, deployment]);
                log.info(`GET form ${form.uid} SUCCESS`);
            })
            .catch((error) => {
                log.warn(`GET KoboToolbox Form Definitions FAILED with\n${error?.message}`);
            });
    }
    log.info(`GET KoboToolbox Form Definitions SUCCESS`);
};

export const getTaxonomies = async (db) => {
    log.info(`GET Taxonomy Definitions`);

    const BAHIS_TAXONOMY_DEFINITION_ENDPOINT = `${BAHIS_SERVER_URL}/api/taxonomy/taxonomies`;
    const api_url = _url(BAHIS_TAXONOMY_DEFINITION_ENDPOINT);
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of auth

    log.info('GET Taxonomy List from server');
    const taxonomyList = await axios
        .get(api_url)
        .then((response) => {
            log.info('GET Taxonomy List SUCCESS');
            return response.data;
        })
        .catch((error) => {
            log.warn('GET Taxonomy List FAILED with\n', error?.message);
        });

    const upsertQuery = db.prepare('INSERT INTO taxonomy (slug, csv_file) VALUES (?, ?);');
    const BAHIS_TAXONOMY_CSV_ENDPOINT = (filename) => `${BAHIS_SERVER_URL}/media/${filename}`;

    for (const taxonomy of taxonomyList) {
        log.info(`GET Taxonomy CSV ${taxonomy.slug} from server`);
        // FIXME this API endpoint needs to take care of auth
        axios
            .get(BAHIS_TAXONOMY_CSV_ENDPOINT(taxonomy.csv_file_stub))
            .then((response) => {
                try {
                    if (!existsSync(`${app.getAppPath()}/taxonomies/`)) {
                        log.info('Creating taxonomies directory');
                        mkdirSync(`${app.getAppPath()}/taxonomies/`);
                    }
                    writeFileSync(`${app.getAppPath()}/${taxonomy.csv_file_stub}`, response.data, 'utf-8');
                } catch (error) {
                    log.warn('GET Taxonomy CSV FAILED while saving with\n', error?.message);
                }
                upsertQuery.run([taxonomy.slug, taxonomy.csv_file_stub]);
                log.info(`GET Taxonomy CSV ${taxonomy.slug} SUCCESS`);
            })
            .catch((error) => {
                log.warn(`GET Taxonomy CSV FAILED with\n${error?.message}`);
            });
    }
};

export const getAdministrativeRegions = async (db) => {
    log.info(`GET getAdministrativeRegionLevels Definitions`);

    const BAHIS_ADMINISTRATIVE_REGION_LEVELS_ENDPOINT = `${BAHIS_SERVER_URL}/api/taxonomy/administrative-region-levels`;
    const api_levels_url = _url(BAHIS_ADMINISTRATIVE_REGION_LEVELS_ENDPOINT);
    log.info(`API URL: ${api_levels_url}`);
    // FIXME this API endpoint needs to take care of auth

    axios
        .get(api_levels_url)
        .then((response) => {
            if (response.data) {
                log.info('Administrative Region Levels received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO administrativeregionlevel (id, title) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title;',
                );

                for (const administrativeregionlevel of response.data) {
                    upsertQuery.run([administrativeregionlevel.id, administrativeregionlevel.title]);
                }
            }
            log.info('GET getAdministrativeRegionLevels Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET getAdministrativeRegionLevels Definitions FAILED with\n', error?.message);
        });

    log.info(`GET getAdministrativeRegions Definitions`);

    const BAHIS_ADMINISTRATIVE_REGIONS_ENDPOINT = (user_region_id) =>
        `${BAHIS_SERVER_URL}/api/taxonomy/administrative-regions-catchment/?id=${user_region_id}`;
    const api_url = _url(BAHIS_ADMINISTRATIVE_REGIONS_ENDPOINT(309328));
    log.info(`API URL: ${api_url}`);
    // FIXME this API endpoint needs to take care of auth
    // FIXME we currently hard code ghatails geocode

    axios
        .get(api_url)
        .then((response) => {
            if (response.data) {
                log.info('Administrative Regions received from server');

                const upsertQuery = db.prepare(
                    'INSERT INTO administrativeregion (id, title, parent_administrative_region, administrative_region_level) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, parent_administrative_region = excluded.parent_administrative_region, administrative_region_level = excluded.administrative_region_level;',
                );

                for (const administrativeregion of response.data) {
                    upsertQuery.run([
                        administrativeregion.id,
                        administrativeregion.title,
                        administrativeregion.parent_administrative_region,
                        administrativeregion.administrative_region_level,
                    ]);
                }
            }
            log.info('GET getAdministrativeRegions Definitions SUCCESS');
        })
        .catch((error) => {
            log.warn('GET getAdministrativeRegions Definitions FAILED with\n', error?.message);
        });
};
