import * as React from 'react';
import { Table } from 'reactstrap';
import { ipcRenderer } from '../../services/ipcRenderer';

interface ColumnObj {
  sortable: true | false;
  label: { [key: string]: string };
  field_name: string;
  format: string;
  data_type: string;
}

interface DataSourceObj {
  type: string;
  query: string;
  config_json: any;
}

export interface ListTableProps {
  columnDefinition: ColumnObj[];
  datasource: DataSourceObj;
  filters: any;
}

/** state inteface for ListTable */
export interface ListTableState {
  tableData: Array<{ [key: string]: any }>;
  filters: any;
}

class ListTable extends React.Component<ListTableProps, ListTableState> {
  constructor(props: ListTableProps) {
    super(props);
    this.state = { tableData: [], filters: {} };
  }

  public async componentDidMount() {
    const { datasource, filters } = this.props;
    const response = await ipcRenderer.sendSync(
      'fetch-query-data',
      'select * from ' + datasource.query
    );
    this.setState({ ...this.state, tableData: response || [], filters });
  }

  public render() {
    const { columnDefinition } = this.props;
    const appLanguage = 'English';
    return (
      <Table>
        <thead>
          <tr>
            {columnDefinition.map((singleCol: ColumnObj, index: number) => (
              <th key={'col-label-' + index}> {singleCol.label[appLanguage]} </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {this.state &&
            this.state.tableData &&
            this.state.tableData.map((rowObj, rowIndex: number) => (
              <tr key={'table-row-' + rowIndex}>
                {columnDefinition.map((colObj: ColumnObj, colIndex: number) => (
                  <td key={'data-field-' + colIndex}>{rowObj[colObj.field_name]}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </Table>
    );
  }
}

export default ListTable;
