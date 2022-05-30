/** This module handles settings taken from environment variables */

export const SERVER_URL = process.env.BAHIS_SERVER;
export type SERVER_URL= typeof SERVER_URL;

export const GEOLOC_ENDPOINT = `${SERVER_URL}/bhmodule/catchment-data-sync/`;
export type GEOLOC_ENDPOINT = typeof GEOLOC_ENDPOINT;
