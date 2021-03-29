import { ipcRenderer } from "../services/ipcRenderer";

/** Interface for an object that is allowed to have any property */
export interface FlexObject {
  [key: string]: any;
}

/**
 * returns the desired language text using identifier or empty text
 * @param {FlexObject} multiLanguageObject - the multi language object
 * @param {string} languageIdentifier - the language identifier
 * @returns {string} - the native language text
 */
export function getNativeLanguageText(multiLanguageObject: FlexObject, languageIdentifier: string) {
  return multiLanguageObject[languageIdentifier] || '';
}

export const appSync = async () => {
  const user: any = await ipcRenderer.sendSync('fetch-username');
  await ipcRenderer.send('start-app-sync', user.username);
  ipcRenderer.on('formSyncComplete', async function(event: any, args: any) {
    console.log('check', event, args);
    return args;
    // if (args == 'done') {
    //   return true;
    // } else {
    //   return false;
    // }
  });
}

export const dataSync = async () => {
  const user: any = await ipcRenderer.sendSync('fetch-username');
  await ipcRenderer.send('request-data-sync', user.username);
  ipcRenderer.on('dataSyncComplete', async function(event: any, args: any) {
    console.log('check', event, args);
    return args
  });
}

