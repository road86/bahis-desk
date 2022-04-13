// SERVER URLShttp://dyn-bahis-dev.mpower-social.com:8043/
// const SERVER_URL = 'http://dyn-bahis-dev.mpower-social.com'; //dev
const SERVER_URL = 'http://dynamic-bahis.mpower-social.com';
// const SERVER_URL = 'http://bahis.dls.gov.bd' // Bahis_govt
// const SERVER_URL = 'http://dyn-bahis-qa.mpower-social.com'; //qa
// const SERVER_URL = 'http://192.168.23.5:8001';
// TODO Need to update /0/ at the end of DB_TABLES_ENDPOINT DYNAMICALLY
const DB_TABLES_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get/form-config/?/`;
const APP_DEFINITION_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/module-list/`;
const FORMS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/form-list/`;
const LISTS_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/list-def/`;
const FORM_CHOICE_ENDPOINT = `${SERVER_URL}/bhmodule/core_admin/get-api/form-choices/`;
const SIGN_IN_ENDPOINT = `${SERVER_URL}/bhmodule/app-user-verify/`;

module.exports = { SERVER_URL, DB_TABLES_ENDPOINT, APP_DEFINITION_ENDPOINT, FORMS_ENDPOINT, LISTS_ENDPOINT, SIGN_IN_ENDPOINT, FORM_CHOICE_ENDPOINT };