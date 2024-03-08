// import { ipcRenderer } from '../services/ipcRenderer';
// import * as XLSX from 'xlsx';
// import { log } from './log';

export interface FlexObject {
    [key: string]: any;
}
// const SELECT_ALL = 'select all that apply';
// const SELECT_ONE = 'select one';

export function getNativeLanguageText(multiLanguageObject: FlexObject, languageIdentifier: string) {
    return multiLanguageObject[languageIdentifier] || '';
}

// export const exportToExcel = (excelData: any) => {
//     const ws = XLSX.utils.json_to_sheet(excelData);
//     const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
//     const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     // const data = new Blob([excelBuffer], { type: fileType });
//     ipcRenderer.send('export-xlsx', excelBuffer);
//     // FileSaver.saveAs(data, 'UserStatistics' + '.xlsx');
// };

// export const exportToExcelForSubmittedData = (tableData: any, filteredColumns: any, choiceList: any) => {
//     const excelData: any[] = [];
//     let excelTabs: any = {};
//     log.info(filteredColumns, tableData, choiceList);
//     for (const row of tableData) {
//         const data = JSON.parse(row.data);
//         log.info('data: ', data);

//         //TODO   Line 63:20:    Unnecessarily computed property ['instance id'] found  no-useless-computed-key
//         let newRow = { ['instance id']: row.instanceid };
//         for (const k of Object.keys(data)) {
//             const xlTab = filteredColumns[k];
//             if (xlTab && xlTab.type !== SELECT_ALL) {
//                 let readableValue = '';
//                 if (xlTab.fieldElement) readableValue = getReadableValue(data[k], xlTab.fieldElement, choiceList);
//                 else readableValue = data[k];

//                 newRow = { ...newRow, [xlTab.label]: readableValue };
//             } else if (xlTab) {
//                 if (!Object.keys(excelTabs).includes(xlTab.label)) {
//                     excelTabs = { ...excelTabs, [xlTab.label]: [] };
//                 }
//                 //the pop function will remove the trailing space
//                 const multipleAns = data[k].substring(0, data[k].length - 1);
//                 const result = multipleAns.split(' ').map((item: any) => ({
//                     ['instance id']: row.instanceid,
//                     value: getReadableValue(item, xlTab.fieldElement, choiceList),
//                 }));
//                 excelTabs[xlTab.label] = excelTabs[xlTab.label].concat(result);
//             }
//         }
//         excelData.push(newRow);
//     }
//     for (const item of Object.keys(excelTabs)) {
//         excelTabs[item] = XLSX.utils.json_to_sheet(excelTabs[item]);
//     }
//     const ws = XLSX.utils.json_to_sheet(excelData);
//     const wb = { Sheets: { data: ws, ...excelTabs }, SheetNames: ['data', ...Object.keys(excelTabs)] };
//     const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     // const data = new Blob([excelBuffer], { type: fileType });
//     ipcRenderer.send('export-xlsx', excelBuffer);
//     // FileSaver.saveAs(data, 'UserStatistics' + '.xlsx');
// };

// const getReadableValue = (fieldValue: any, formField: any, choices: any) => {
//     //  it means that value has been selected from csv-list.
//     if (formField && formField.control && formField.control.appearance && formField.control.appearance.includes('search')) {
//         // eslint-disable-next-line no-useless-escape
//         const processedStringArray = formField.control.appearance.match(/\([^\)]+\)/i) || [''];
//         let params = processedStringArray[0];

//         if (params.length > 2) {
//             params = params.substring(1, params.length - 1);
//             const csvName = params.split(',')[0].replaceAll("'", '');

//             log.info(formField, fieldValue);
//             const csvChoices = choices.formChoices[`${csvName}.csv`];
//             log.info('choices');
//             log.info(csvChoices);
//             log.info('csvname :', csvName);
//             let result = csvChoices.find(
//                 (option: any) => String(option[formField.children[0].name]).trim() === String(fieldValue).trim(),
//             );
//             log.info('result :', result);
//             if (result === undefined) return ' -- ';
//             else {
//                 result = result[getFormLabel(formField.children[0].label)];
//                 return result;
//             }
//         }
//     } else if (formField.type === SELECT_ONE || formField.type === SELECT_ALL) {
//         for (let i = 0; i < choices.simpleFormChoice.length; i++) {
//             const choice = choices.simpleFormChoice[i];

//             if (choice.field_name.includes(formField.name) && String(choice.value_text).trim() === String(fieldValue).trim()) {
//                 return getFormLabel(choice.value_label);
//             }
//         }
//     } else {
//         return typeof fieldValue == 'string' ? fieldValue : JSON.stringify(fieldValue);
//     }
// };

export function getFormLabel(label: any) {
    if (typeof label === 'object') return label.English;
    if (typeof label === 'string') {
        let result: any = '';
        try {
            result = JSON.parse(label);
            result = result.English;
        } catch (error) {
            result = label;
        }
        return result;
    }
}
