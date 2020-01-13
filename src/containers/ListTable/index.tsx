import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Table } from 'reactstrap';
import { Store } from 'redux';
import { ipcRenderer } from '../../services/ipcRenderer';
import ListTableReducer, {
  getAllColumnsValueObj,
  getPageNumber,
  getPageSize,
  reducerName as ListTableReducerName,
  resetListTable,
  setPageNumber,
  setPageSize,
} from '../../store/ducks/listTable';
import { PAGINATION_SIZE } from './constants';
import './ListTable.css';
import OrderBy from './OrderBy.tsx';

export interface ColumnObj {
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
  orderSql: string;
  resetListTableActionCreator: typeof resetListTable;
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
  setPageSizeActionCreator: typeof setPageSize;
  setPageNumberActionCreator: typeof setPageNumber;
}

/** state inteface for ListTable */
export interface ListTableState {
  tableData: Array<{ [key: string]: any }>;
  filters: any;
  orderSql: string;
}

/** register the filter reducer */
reducerRegistry.register(ListTableReducerName, ListTableReducer);

class ListTable extends React.Component<ListTableProps, ListTableState> {
  constructor(props: ListTableProps) {
    super(props);
    this.state = { tableData: [], filters: {}, orderSql: '' };
  }

  public async componentDidMount() {
    const {
      datasource,
      filters,
      resetListTableActionCreator,
      setPageSizeActionCreator,
      setPageNumberActionCreator,
    } = this.props;
    resetListTableActionCreator();
    setPageSizeActionCreator(PAGINATION_SIZE);
    setPageNumberActionCreator(1);
    const randomTableName =
      'tab' +
      Math.random()
        .toString(36)
        .substring(2, 12);
    const response = await ipcRenderer.sendSync(
      'fetch-query-data',
      datasource.type === '0'
        ? 'select * from ' + datasource.query
        : `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName}`
    );
    this.setState({ ...this.state, tableData: response || [], filters });
  }

  public async componentDidUpdate() {
    const { datasource, filters, orderSql } = this.props;
    const stateFilters = this.state.filters;
    const stateOrderSql = this.state.orderSql;
    const orderSqlTxt = orderSql !== '' ? ` ORDER BY ${orderSql}` : '';
    const randomTableName =
      'tab' +
      Math.random()
        .toString(36)
        .substring(2, 12);
    if (filters !== stateFilters || orderSql !== stateOrderSql) {
      const response = await ipcRenderer.sendSync(
        'fetch-query-data',
        datasource.type === '0'
          ? 'select * from ' + datasource.query + this.generateSqlWhereClause(filters) + orderSqlTxt
          : `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName}` +
              this.generateSqlWhereClause(filters) +
              orderSqlTxt
      );
      this.setState({ ...this.state, tableData: response || [], filters, orderSql });
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
                <th key={'col-label-' + index}>
                  {singleCol.sortable && (
                    <OrderBy colDefifinitionObj={singleCol} appLanguage={appLanguage} />
                  )}
                </th>
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

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  orderSql: string;
  pageSize: number;
  pageNumber: number;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const columnsValue = getAllColumnsValueObj(state);
  const firstColumnName = Object.keys(columnsValue)[0] || null;
  const result = {
    orderSql: firstColumnName ? columnsValue[firstColumnName].orderSql : '',
    pageNumber: getPageNumber(state),
    pageSize: getPageSize(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  resetListTableActionCreator: resetListTable,
  setPageNumberActionCreator: setPageNumber,
  setPageSizeActionCreator: setPageSize,
};

/** connect ListTable to the redux store */
const ConnectedListTable = connect(
  mapStateToProps,
  mapDispatchToProps
)(ListTable);

export default ConnectedListTable;
