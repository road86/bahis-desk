const electron = require('electron');

//setting env variables for global builds do not work that well, temporarily hardcodeing
//const SERVER_URL = process.env.BAHIS_SERVER;
const SERVER_URL = 'http://www.bahis2-dev.net'; //dev
// const SERVER_URL = 'http://bahis.dls.gov.bd'; //production
//const SERVER_URL = 'http://localhost';

const APP_VERSION = electron.app.getVersion();
const DB_TABLES_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get/form-config/?/`;
const CATCHMENT_DEFINITION_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/catchment-list/`;
const APP_DEFINITION_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/module-list/`;
const FORMS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/form-list/`;
const LISTS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/list-def/`;
const FORM_CHOICE_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/form-choices/`;
const SIGN_IN_ENDPOINT = `${SERVER_URL}/bhmodule/app-user-verify/`;

module.exports = {
  SERVER_URL,
  DB_TABLES_ENDPOINT,
  CATCHMENT_DEFINITION_ENDPOINT,
  APP_DEFINITION_ENDPOINT,
  FORMS_ENDPOINT,
  LISTS_ENDPOINT,
  SIGN_IN_ENDPOINT,
  FORM_CHOICE_ENDPOINT,
};
