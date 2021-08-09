import { ipcRenderer } from '../services/ipcRenderer';
import * as XLSX from 'xlsx';
import _ from 'lodash';

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
  ipcRenderer.on('formSyncComplete', async function (event: any, args: any) {
    console.log('check', event, args);
    return args;
    // if (args == 'done') {
    //   return true;
    // } else {
    //   return false;
    // }
  });
};

export const dataSync = async () => {
  const user: any = await ipcRenderer.sendSync('fetch-username');
  await ipcRenderer.send('request-data-sync', user.username);
  ipcRenderer.on('dataSyncComplete', async function (event: any, args: any) {
    console.log('check', event, args);
    return args;
  });
};

export const exportToExcel = (tableData: any, filteredColumns: any, language: string) => {
  const filter = filteredColumns.map((a: { field_name: string; }) => a.field_name);
  const labels = filteredColumns.map((a: any) => a.label[language]);
  const excelDataList = tableData.map((a: any) => _.pick(a, filter));
  const excelData: any = excelDataList.map((obj: any) => {
    const newObj: any = {};
    for (let i =0 ; i< filter.length; i++) {
      newObj[labels[i]] = obj[filter[i]];
    }
    return newObj;
  });
  // const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  // const data = new Blob([excelBuffer], { type: fileType });
  ipcRenderer.send('export-xlsx', excelBuffer);
  // FileSaver.saveAs(data, 'UserStatistics' + '.xlsx');
};