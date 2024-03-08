import { log } from '../helpers/log';
import { ipcRenderer } from '../services/ipcRenderer';

export const readFormData = (tableName: string, form_uid: string, instance_id?: string) => {
    log.info(`reading data from ${tableName} table...`);
    log.info(`  for form_uid: ${form_uid}...`);
    if (instance_id) log.info(`  for instance_id: ${instance_id}...`);
    let query = `SELECT * FROM ${tableName} WHERE form_uid IS '${form_uid}'`;
    if (instance_id) query += ` AND uuid IS '${instance_id}'`;
    return ipcRenderer
        .invoke('get-local-db', query)
        .then((response) => {
            log.info(`  read ${response.length} records`);
            return response;
        })
        .catch((error) => {
            log.error(`Error reading form data: ${error}`);
            return [];
        });
};
