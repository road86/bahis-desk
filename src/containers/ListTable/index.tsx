import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import Pagination from 'react-js-pagination';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Table } from 'reactstrap';
import { Store } from 'redux';
import { ipcRenderer } from '../../services/ipcRenderer';
import ListTableReducer, {
  getAllColumnsValueObj,
  getPageNumber,
  getPageSize,
  getTotalRecords,
  reducerName as ListTableReducerName,
  resetListTable,
  setPageNumber,
  setPageSize,
  setTotalRecords,
} from '../../store/ducks/listTable';
import { PAGINATION_SIZE } from './constants';
import Export from './Export';
import './ListTable.css';
import OrderBy from './OrderBy';

export interface ColumnObj {
  sortable: true | false;
  label: { [key: string]: string };
  field_name: string;
  format: string;
  data_type: string;
}

export interface ActionDefinition {
  xform_id: number;
  data_mapping: [];
  action_type: string;
}

export interface ActionColumnObj {
  action_definition: ActionDefinition;
  data_type: 'action';
  label: { [key: string]: string };
}

/** typeguard to differentiate between ColumnObj and ActionColumnObj */
export const isColumnObj = (obj: ColumnObj | ActionColumnObj): obj is ColumnObj => {
  return 'sortable' in obj;
};

interface DataSourceObj {
  type: string;
  query: string;
  config_json: any;
}

export interface ListTableProps {
  columnDefinition: Array<ColumnObj | ActionColumnObj>;
  datasource: DataSourceObj;
  filters: any;
  orderSql: string;
  resetListTableActionCreator: typeof resetListTable;
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
  setPageSizeActionCreator: typeof setPageSize;
  setPageNumberActionCreator: typeof setPageNumber;
  setTotalRecordsActionCreator: typeof setTotalRecords;
}

/** state inteface for ListTable */
export interface ListTableState {
  tableData: Array<{ [key: string]: any }>;
  filters: any;
  orderSql: string;
  pageNumber: number;
}

/** register the filter reducer */
reducerRegistry.register(ListTableReducerName, ListTableReducer);

class ListTable extends React.Component<ListTableProps, ListTableState> {
  constructor(props: ListTableProps) {
    super(props);
    this.state = { tableData: [], filters: {}, orderSql: '', pageNumber: 1 };
  }

  public async componentDidMount() {
    const {
      datasource,
      filters,
      resetListTableActionCreator,
      setPageSizeActionCreator,
      setPageNumberActionCreator,
      setTotalRecordsActionCreator,
    } = this.props;
    resetListTableActionCreator();
    setPageSizeActionCreator(PAGINATION_SIZE);
    setPageNumberActionCreator(1);
    const randomTableName =
      'tab' +
      Math.random()
        .toString(36)
        .substring(2, 12);
    const totalRecordsResponse = await ipcRenderer.sendSync(
      'fetch-query-data',
      datasource.type === '0'
        ? `select count(*) as count from ${datasource.query}`
        : `with ${randomTableName} as (${datasource.query}) select count(*) as count from ${randomTableName}`
    );
    setTotalRecordsActionCreator(totalRecordsResponse[0].count);
    const response = await ipcRenderer.sendSync(
      'fetch-query-data',
      datasource.type === '0'
        ? `select count(*) as count from ${datasource.query} limit ${PAGINATION_SIZE} offset 0`
        : `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName} limit ${PAGINATION_SIZE} offset 0`
    );
    this.setState({ ...this.state, tableData: response || [], filters });
  }

  public async componentDidUpdate() {
    const {
      datasource,
      filters,
      orderSql,
      pageNumber,
      pageSize,
      setTotalRecordsActionCreator,
      setPageNumberActionCreator,
    } = this.props;
    const stateFilters = this.state.filters;
    const stateOrderSql = this.state.orderSql;
    const statePageNumber = this.state.pageNumber;
    const orderSqlTxt = orderSql !== '' ? ` ORDER BY ${orderSql}` : '';
    const randomTableName =
      'tab' +
      Math.random()
        .toString(36)
        .substring(2, 12);
    if (filters !== stateFilters || orderSql !== stateOrderSql || pageNumber !== statePageNumber) {
      const newPageNumber = filters !== stateFilters || orderSql !== stateOrderSql ? 1 : pageNumber;
      if (filters !== stateFilters) {
        const totalRecordsResponse = await ipcRenderer.sendSync(
          'fetch-query-data',
          datasource.type === '0'
            ? 'select count(*) as count from ' +
                datasource.query +
                this.generateSqlWhereClause(filters)
            : `with ${randomTableName} as (${datasource.query}) select count(*) as count from ${randomTableName}` +
                this.generateSqlWhereClause(filters)
        );
        setTotalRecordsActionCreator(totalRecordsResponse[0].count);
      }
      const response = await ipcRenderer.sendSync(
        'fetch-query-data',
        datasource.type === '0'
          ? 'select * from ' +
              datasource.query +
              this.generateSqlWhereClause(filters) +
              orderSqlTxt +
              ` limit ${pageSize} offset ${newPageNumber - 1}`
          : `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName}` +
              this.generateSqlWhereClause(filters) +
              orderSqlTxt +
              ` limit ${pageSize} offset ${newPageNumber - 1}`
      );
      setPageNumberActionCreator(newPageNumber);
      this.setState({
        ...this.state,
        filters,
        orderSql,
        pageNumber: newPageNumber,
        tableData: response || [],
      });
    }
  }

  public render() {
    const {
      columnDefinition,
      pageNumber,
      totalRecords,
      pageSize,
      datasource,
      filters,
      orderSql,
    } = this.props;
    const appLanguage = 'English';
    const orderSqlTxt = orderSql !== '' ? ` ORDER BY ${orderSql}` : '';
    const randomTableName =
      'tab' +
      Math.random()
        .toString(36)
        .substring(2, 12);
    const query =
      datasource.type === '0'
        ? 'select * from ' + datasource.query + this.generateSqlWhereClause(filters) + orderSqlTxt
        : `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName}` +
          this.generateSqlWhereClause(filters) +
          orderSqlTxt;
    return (
      <div>
        <div className="table-container">
          <Export query={query} appLanguage={appLanguage} colDefifinition={columnDefinition} />
          <Table striped={true} borderless={true}>
            <thead>
              <tr>
                {columnDefinition.map((singleCol: ColumnObj | ActionColumnObj, index: number) => {
                  if (isColumnObj(singleCol)) {
                    return (
                      <th key={'col-label-' + index}>
                        {singleCol.sortable && (
                          <OrderBy colDefifinitionObj={singleCol} appLanguage={appLanguage} />
                        )}
                      </th>
                    );
                  } else {
                    return <th key={'col-label-' + index}>{singleCol.label[appLanguage]}</th>;
                  }
                })}
              </tr>
            </thead>
            <tbody>
              {this.state &&
                this.state.tableData &&
                this.state.tableData.map((rowObj, rowIndex: number) => (
                  <tr key={'table-row-' + rowIndex}>
                    {columnDefinition.map((colObj: ColumnObj | ActionColumnObj, colIndex: number) =>
                      isColumnObj(colObj) ? (
                        <td key={'data-field-' + colIndex}>{rowObj[colObj.field_name]}</td>
                      ) : (
                        <td key={'data-field-' + colIndex}>
                          <Link to={`/form/${colObj.action_definition.xform_id}/`}>
                            <Button> Entry </Button>
                          </Link>
                        </td>
                      )
                    )}
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
        <div className="pagination-container">
          <Pagination
            activePage={pageNumber}
            itemsCountPerPage={pageSize}
            totalItemsCount={totalRecords}
            onChange={this.onPageChange}
            itemClass="page-item"
            linkClass="page-link"
          />
        </div>
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

  private onPageChange = (pageNumber: number) => {
    this.props.setPageNumberActionCreator(pageNumber);
  };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  orderSql: string;
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const columnsValue = getAllColumnsValueObj(state);
  const firstColumnName = Object.keys(columnsValue)[0] || null;
  const result = {
    orderSql: firstColumnName ? columnsValue[firstColumnName].orderSql : '',
    pageNumber: getPageNumber(state),
    pageSize: getPageSize(state),
    totalRecords: getTotalRecords(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  resetListTableActionCreator: resetListTable,
  setPageNumberActionCreator: setPageNumber,
  setPageSizeActionCreator: setPageSize,
  setTotalRecordsActionCreator: setTotalRecords,
};

/** connect ListTable to the redux store */
const ConnectedListTable = connect(
  mapStateToProps,
  mapDispatchToProps
)(ListTable);

export default ConnectedListTable;
