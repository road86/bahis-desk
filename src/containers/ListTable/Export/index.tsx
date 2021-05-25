// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
// import ReactExport from 'react-export-excel';
import { ActionColumnObj, ColumnObj, isColumnObj } from '..';
// import { theme } from '../../../configs/theme';
import { ipcRenderer } from '../../../services/ipcRenderer';
import * as XLSX from 'xlsx';
import { Button } from '@material-ui/core';
import _ from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// const ExcelFile = ReactExport.ExcelFile;
// const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
// const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

interface ExportProps {
  colDefifinition: Array<ColumnObj | ActionColumnObj>;
  appLanguage: string;
  query: string;
}

interface ExportState {
  dataset: any;
  query: string;
}

class Export extends React.Component<ExportProps, ExportState> {
  public state = { dataset: null, query: '' };

  public async componentDidMount() {
    const { query } = this.props;
    const response = await ipcRenderer.sendSync('fetch-query-data', query);
    this.setState({ ...this.state, dataset: response, query });
  }

  public async componentDidUpdate() {
    const { query } = this.props;
    const stateQuery = this.state.query;
    if (query !== stateQuery) {
      const response = await ipcRenderer.sendSync('fetch-query-data', query);
      this.setState({ ...this.state, dataset: response, query });
    }
  }


  public render() {
    const { colDefifinition } = this.props;
    const { dataset } = this.state;
    const filterColumns = colDefifinition.filter((tmp) => isColumnObj(tmp) && tmp.exportable == true);
    if (dataset) {
      return (
        <Button style={{ backgroundColor: '#8ac390', borderColor: '#8ac390', margin: 10}} onClick={() => this.exportToExcel(dataset, filterColumns)}>
          <FontAwesomeIcon icon={['fas', 'long-arrow-alt-down']}/> Export to XLSX
        </Button>
      );
    }
    return null;
  }

  private exportToExcel = (tableData: any, filteredColumns: any) => {
    const filter = filteredColumns.map((a: { field_name: string; }) => a.field_name);
    const labels = filteredColumns.map((a: any) => a.label[this.props.appLanguage]);
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
}

export default Export;
