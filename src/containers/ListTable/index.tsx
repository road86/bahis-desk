import * as React from 'react';
import { Table } from 'reactstrap';
import { ipcRenderer } from '../../services/ipcRenderer';
import './ListTable.css';

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
      datasource.type === '0' ? 'select * from ' + datasource.query : datasource.query
    );
    this.setState({ ...this.state, tableData: response || [], filters });
  }

  public async componentDidUpdate() {
    const { datasource, filters } = this.props;
    const stateFilters = this.state.filters;
    if (filters !== stateFilters) {
      const response = await ipcRenderer.sendSync(
        'fetch-query-data',
        datasource.type === '0'
          ? 'select * from ' + datasource.query + this.generateSqlWhereClause(filters)
          : datasource.query + this.generateSqlWhereClause(filters)
      );
      this.setState({ ...this.state, tableData: response || [], filters });
    }
  }

  public render() {
    const { columnDefinition } = this.props;
    const appLanguage = 'English';
    return (
      <div className="table-container">
        <Table striped={true} borderless={true}>
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
      </div>
    );
  }

  private generateSqlWhereClause = (filters: any) => {
    let sqlWhereClause = '';
    Object.keys(filters).forEach(filterName => {
      if (filters[filterName].sql !== '') {
        sqlWhereClause = `${sqlWhereClause} and ${filters[filterName].sql}`;
      }
    });
    return sqlWhereClause !== '' ? ' where ' + sqlWhereClause.substring(4) : '';
  };
}

export default ListTable;
