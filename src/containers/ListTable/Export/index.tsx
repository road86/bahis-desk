import React from 'react';
import ReactExport from 'react-export-excel';
import { ActionColumnObj, ColumnObj, isColumnObj } from '..';
import { ipcRenderer } from '../../../services/ipcRenderer';

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

interface ExportProps {
  colDefifinition: Array<ColumnObj | ActionColumnObj>;
  appLanguage: string;
  query: string;
}

interface ExportState {
  dataset: any;
}

class Export extends React.Component<ExportProps, ExportState> {
  public state = { dataset: null };

  public async componentDidMount() {
    const { query } = this.props;
    const response = await ipcRenderer.sendSync('fetch-query-data', query);
    this.setState({ ...this.state, dataset: response });
  }

  public render() {
    const { colDefifinition, appLanguage } = this.props;
    const { dataset } = this.state;
    const filterColumns = colDefifinition.filter(tmp => isColumnObj(tmp));
    if (dataset) {
      return (
        <ExcelFile>
          <ExcelSheet data={dataset} name="test">
            {filterColumns.map(
              colObj =>
                isColumnObj(colObj) && (
                  <ExcelColumn label={colObj.label[appLanguage]} value={colObj.field_name} />
                )
            )}
          </ExcelSheet>
        </ExcelFile>
      );
    }
    return null;
  }
}

export default Export;
