import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import ReactExport from 'react-export-excel';
import { Button } from 'reactstrap';
import { ActionColumnObj, ColumnObj, isColumnObj } from '..';
import { theme } from '../../../configs/theme';
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
    const { colDefifinition, appLanguage } = this.props;
    const { dataset } = this.state;
    const filterColumns = colDefifinition.filter((tmp) => isColumnObj(tmp) && tmp.exportable == true);
    console.log('what filter columns', filterColumns);
    if (dataset) {
      return (
        <ExcelFile
          element={
            <Button style={{ backgroundColor: theme.palette.primary.dark, borderColor: theme.palette.primary.dark, margin: 10}} size="sm">
              <FontAwesomeIcon icon={['fas', 'long-arrow-alt-down']} /> Export to XLSX
            </Button>
          }
        >
          <ExcelSheet data={dataset} name="test">
            {filterColumns.map(
              (colObj, index) =>
                isColumnObj(colObj) && (
                  <ExcelColumn
                    key={'export-column-' + index}
                    label={colObj.label[appLanguage]}
                    value={colObj.field_name}
                  />
                ),
            )}
          </ExcelSheet>
        </ExcelFile>
      );
    }
    return null;
  }
}

export default Export;
