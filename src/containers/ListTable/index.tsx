import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    TableContainer,
    TablePagination,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Grid,
} from '@material-ui/core';
import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
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
import Export from './Export';
import './ListTable.css';
import LookUp from './LookUp';
import OrderBy from './OrderBy';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import _ from 'lodash';
import { getFormLabel } from '../../helpers/utils';
import { logger } from '../../helpers/logger';

export interface LookupDefinition {
    table_name: string;
    return_column: string;
    column_name: string;
    match_column?: string;
    query: any;
    condition: any;
    datasource: any;
    lookup_type?: string;
    form_id?: string;
    form_field: string;
}

export interface ColumnObj {
    sortable: true | false;
    label: { [key: string]: string };
    field_name: string;
    format: string;
    data_type: string;
    lookup_definition?: LookupDefinition;
    exportable: boolean;
    hidden?: boolean;
}

export interface MappingObj {
    column: string;
    form_field: string;
}

export interface ActionDefinition {
    details_pk?: string;
    form_title: string;
    xform_id: number;
    data_mapping: MappingObj[];
    action_type: string;
    label: { [key: string]: string };
    formData?: string;
}

export interface ActionColumnObj {
    action_definition: ActionDefinition[];
    data_type: 'action';
    label: { [key: string]: string };
    hidden: boolean;
}

/** typeguard to differentiate between ColumnObj and ActionColumnObj */
export const isColumnObj = (obj: ColumnObj | ActionColumnObj): obj is ColumnObj => {
    return obj.data_type !== 'action';
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
    listId: string;
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
    lookupTableForDatasource: any;
    lookupTableForLabel: any;
    filters: any;
    orderSql: string;
    pageNumber: number;
    rowsPerPage: number;
    page: number;
}

/** register the filter reducer */
reducerRegistry.register(ListTableReducerName, ListTableReducer);

/**
 *  STUFF YOU NEED TO KNOW BEFORE YOU START DEBUGGING THIS COMPONENT
 *
 * All the list come from an API (/get-api/list-def/). there is a table in the database named 'lists'. it contains all the list data.
 *  'lists' table has many columns amongst two major columns are  Datasource and Column Definition (CD).
 *
 *  # Datasource:  it just contains a query.
 *
 *  # Column definition: it contains a list of columns. each column has its own lookup_definition.
 *  some columns might have lookuptype and some don't. lookuptype can be 3 types.
 *  1. table
 *  2. datasource
 *  3. label
 *
 * table and datasource are almost similar. we need to perform a query that will fetch a dictionary from the database.
 * the purpose of this query is to show  the label of the corresponding value of each row of that column.
 *
 * */

class ListTable extends React.Component<ListTableProps, ListTableState> {
    constructor(props: ListTableProps) {
        super(props);
        this.state = {
            tableData: [],
            filters: {},
            orderSql: '',
            pageNumber: -1,
            lookupTableForDatasource: {},
            lookupTableForLabel: {},
            rowsPerPage: 5,
            page: 0,
        };
    }

    public hasLookup = (column: any): boolean => {
        return 'lookup_definition' in column && column.lookup_definition;
    };

    public async componentDidMount() {
        const {
            datasource,
            filters,
            resetListTableActionCreator,
            setPageSizeActionCreator,
            setPageNumberActionCreator,
            setTotalRecordsActionCreator,
            columnDefinition,
        } = this.props;
        resetListTableActionCreator();
        setPageSizeActionCreator(5);
        setPageNumberActionCreator(1);
        const randomTableName = 'tab' + Math.random().toString(36).substring(2, 12);
        const totalRecordsResponse = await ipcRenderer.sendSync(
            'fetch-query-data',
            datasource.type === '0'
                ? `select count(*) as count from ${datasource.query}`
                : `with ${randomTableName} as (${datasource.query}) select count(*) as count from ${randomTableName}`,
        );
        setTotalRecordsActionCreator(totalRecordsResponse[0].count);
        logger.info(' datasource ');

        logger.info(
            `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName} limit ${this.state.rowsPerPage} offset 0`,
        );
        const response = await ipcRenderer.sendSync(
            'fetch-query-data',
            datasource.type === '0'
                ? `select count(*) as count from ${datasource.query} limit ${this.state.rowsPerPage} offset 0`
                : `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName} limit ${this.state.rowsPerPage} offset 0`,
        );
        const lookupTableForDatasource: any = {};
        let lookupTableForLabel: any = {};
        await columnDefinition.forEach(async (column) => {
            if (
                'lookup_definition' in column &&
                column.lookup_definition &&
                (column.lookup_definition.lookup_type === 'datasource' || column.lookup_definition.lookup_type === 'table')
            ) {
                const query = `with list_table as ( 
            ${datasource.query}
          ), lookup_table as (
            ${column.lookup_definition.query}
          ) select
            list_table.id,
            lookup_table.${column.lookup_definition.return_column}
          from list_table left join lookup_table on list_table.${column.field_name} = lookup_table.${column.lookup_definition.match_column}`;

                logger.info('lookup query');
                logger.info(query);
                const resp = await ipcRenderer.sendSync('fetch-query-data', query);
                lookupTableForDatasource[column.lookup_definition.return_column] = resp;
            }

            if (
                'lookup_definition' in column &&
                column.lookup_definition &&
                column.lookup_definition.lookup_type === 'label'
            ) {
                const form_id: any = column.lookup_definition.form_id;
                const formDefinitionObj = await ipcRenderer.sendSync('fetch-form-definition', form_id);
                const simpleFormChoice = await ipcRenderer.sendSync('fetch-form-choices', form_id);
                lookupTableForLabel = {
                    ...lookupTableForLabel,
                    [form_id]: {
                        simpleFormChoice,
                        formChoices: JSON.parse(formDefinitionObj.formChoices),
                        definition: formDefinitionObj,
                    },
                };
                this.setState({ ...this.state.filters, lookupTableForLabel });
            }
        });

        logger.info('--> tableData: ', response);
        logger.info('lookupTableForDatasource: ', lookupTableForDatasource);
        this.setState({ ...this.state, tableData: response || [], filters, lookupTableForDatasource, lookupTableForLabel });
    }

    public async componentDidUpdate(prevProps: any, prevState: any) {
        const {
            datasource,
            filters,
            orderSql,
            pageNumber,
            pageSize,
            setTotalRecordsActionCreator,
            setPageNumberActionCreator,
        } = this.props;
        logger.info({ prevProps });
        const stateFilters = this.state.filters;
        const stateOrderSql = this.state.orderSql;
        const statePageNumber = this.state.pageNumber;
        const orderSqlTxt = orderSql !== '' ? ` ORDER BY ${orderSql}` : '';
        const randomTableName = 'tab' + Math.random().toString(36).substring(2, 12);
        if (
            filters !== stateFilters ||
            orderSql !== stateOrderSql ||
            pageNumber !== statePageNumber ||
            prevState.rowsPerPage !== this.state.rowsPerPage
        ) {
            const newPageNumber = filters !== stateFilters || orderSql !== stateOrderSql ? 1 : pageNumber;
            if (filters !== stateFilters) {
                const totalRecordsResponse = await ipcRenderer.sendSync(
                    'fetch-query-data',
                    datasource.type === '0'
                        ? 'select count(*) as count from ' + datasource.query + this.generateSqlWhereClause(filters)
                        : `with ${randomTableName} as (${datasource.query}) select count(*) as count from ${randomTableName}` +
                              this.generateSqlWhereClause(filters),
                );
                setTotalRecordsActionCreator(totalRecordsResponse[0].count);
            }

            const query1 =
                'select * from ' +
                datasource.query +
                this.generateSqlWhereClause(filters) +
                orderSqlTxt +
                ` limit ${pageSize} offset ${pageSize * (newPageNumber - 1)}`;

            const query2 =
                `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName}` +
                this.generateSqlWhereClause(filters) +
                orderSqlTxt +
                ` limit ${pageSize} offset ${pageSize * (newPageNumber - 1)}`;

            const response = await ipcRenderer.sendSync('fetch-query-data', datasource.type === '0' ? query1 : query2);
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
        const { columnDefinition, datasource } = this.props;
        const { lookupTableForDatasource, lookupTableForLabel } = this.state;
        const appLanguage = 'English';
        const randomTableName = 'tab' + Math.random().toString(36).substring(2, 12);

        const getCD = (): any[] => {
            const cd = columnDefinition.map((c: any) => ({ ...c, order: parseInt(c.order) }));
            return _.sortBy(cd, ['order']);
        };

        const generateExcel = async () => {
            const excelData: any = [];
            const tableData: any = await ipcRenderer.sendSync(
                'fetch-query-data',
                datasource.type === '0'
                    ? `select count(*) as count from ${datasource.query} `
                    : `with ${randomTableName} as (${datasource.query}) select * from ${randomTableName}`,
            );

            tableData.forEach((row: any) => {
                let newRow = {};
                getCD()
                    .filter((ob: any) => ob.exportable)
                    .map((colObj: any) => {
                        const result = this.hasLookup(colObj)
                            ? LookUp({
                                  columnDef: colObj,
                                  rowValue: row,
                                  lookupTableForDatasource: lookupTableForDatasource,
                                  lookupTableForLabel: lookupTableForLabel,
                              })
                            : row[colObj.field_name];

                        newRow = { ...newRow, [getFormLabel(colObj.label)]: result };
                    });
                excelData.push(newRow);
            });
            return excelData;
        };

        return (
            <>
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                        ListTable
                    </AccordionSummary>
                    <AccordionDetails style={{ display: 'contents' }}>
                        <div style={{ padding: 15 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            {getCD()
                                                .filter((ob: any) => !ob.hidden)
                                                .map((singleCol: ColumnObj | ActionColumnObj, index: number) => {
                                                    if (isColumnObj(singleCol)) {
                                                        return (
                                                            <TableCell
                                                                key={'col-label-' + index}
                                                                className="initialism text-uppercase text-nowrap"
                                                            >
                                                                {singleCol.sortable ? (
                                                                    <OrderBy
                                                                        colDefifinitionObj={singleCol}
                                                                        appLanguage={appLanguage}
                                                                    />
                                                                ) : (
                                                                    singleCol.label[appLanguage]
                                                                )}
                                                            </TableCell>
                                                        );
                                                    } else {
                                                        return (
                                                            <TableCell
                                                                colSpan={singleCol.action_definition.length}
                                                                key={'col-label-' + index}
                                                                style={{ textAlign: 'center' }}
                                                                className="initialism text-uppercase text-nowrap"
                                                            >
                                                                {singleCol.label[appLanguage]}
                                                            </TableCell>
                                                        );
                                                    }
                                                })}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {this.state &&
                                            this.state.tableData &&
                                            this.state.tableData.map((rowObj, rowIndex: number) => (
                                                <TableRow key={'table-row-' + rowIndex}>
                                                    {getCD()
                                                        .filter((ob: any) => !ob.hidden)
                                                        .map((colObj: ColumnObj | ActionColumnObj, colIndex: number) =>
                                                            isColumnObj(colObj) ? (
                                                                <TableCell key={'data-field-' + colIndex}>
                                                                    {this.hasLookup(colObj) ? (
                                                                        <>
                                                                            {LookUp({
                                                                                columnDef: colObj,
                                                                                rowValue: rowObj,
                                                                                lookupTableForDatasource:
                                                                                    lookupTableForDatasource,
                                                                                lookupTableForLabel: lookupTableForLabel,
                                                                            })}
                                                                        </>
                                                                    ) : (
                                                                        rowObj[colObj.field_name]
                                                                    )}
                                                                </TableCell>
                                                            ) : (
                                                                <TableCell
                                                                    key={'data-field-' + colIndex}
                                                                    colSpan={colObj.action_definition.length}
                                                                    style={{ display: 'flex' }}
                                                                >
                                                                    {colObj.action_definition.map(
                                                                        (actionObj: ActionDefinition, actionIndex: number) => {
                                                                            return (
                                                                                <React.Fragment
                                                                                    key={'action-field' + actionIndex}
                                                                                >
                                                                                    {actionObj.action_type === 'details' ? (
                                                                                        <Link
                                                                                            key={'action-field' + actionIndex}
                                                                                            to={`/listProfile/${
                                                                                                this.props.listId
                                                                                            }/?dataJson=${btoa(
                                                                                                JSON.stringify(rowObj),
                                                                                            )}&detailspk=${
                                                                                                actionObj.details_pk
                                                                                            }&xform_id=${actionObj.xform_id}`}
                                                                                        >
                                                                                            <Button
                                                                                                variant="contained"
                                                                                                color={'secondary'}
                                                                                                style={{
                                                                                                    color: '#EBFDED',
                                                                                                    marginRight: 5,
                                                                                                    whiteSpace: 'nowrap',
                                                                                                }}
                                                                                            >
                                                                                                {' '}
                                                                                                {
                                                                                                    actionObj.label[
                                                                                                        appLanguage
                                                                                                    ]
                                                                                                }{' '}
                                                                                            </Button>
                                                                                        </Link>
                                                                                    ) : (
                                                                                        <Link
                                                                                            key={'action-field' + actionIndex}
                                                                                            to={`/form/${
                                                                                                actionObj.xform_id
                                                                                            }/?dataJson=${this.mapListToFormData(
                                                                                                actionObj.data_mapping,
                                                                                                rowObj,
                                                                                            )}`}
                                                                                        >
                                                                                            <Button
                                                                                                variant="contained"
                                                                                                color={'secondary'}
                                                                                                style={{
                                                                                                    color: '#EBFDED',
                                                                                                    marginRight: 5,
                                                                                                    whiteSpace: 'nowrap',
                                                                                                }}
                                                                                            >
                                                                                                {' '}
                                                                                                {
                                                                                                    actionObj.label[
                                                                                                        appLanguage
                                                                                                    ]
                                                                                                }{' '}
                                                                                            </Button>
                                                                                        </Link>
                                                                                    )}
                                                                                </React.Fragment>
                                                                            );
                                                                        },
                                                                    )}
                                                                </TableCell>
                                                            ),
                                                        )}
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    </AccordionDetails>
                    <AccordionActions>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={this.props.totalRecords}
                            rowsPerPage={this.state.rowsPerPage}
                            page={this.state.page}
                            onPageChange={this.handleChangePage}
                            onRowsPerPageChange={this.handleChangeRowsPerPage}
                        />
                    </AccordionActions>
                </Accordion>
                <Grid container xs={12}>
                    <Export generateExcel={generateExcel} />
                </Grid>
            </>
        );
    }

    private handleChangePage = (event: unknown, newPage: number) => {
        // setPage(newPage);
        logger.info(event);
        this.props.setPageNumberActionCreator(newPage + 1);
        this.setState({
            page: newPage,
        });
    };

    private handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.props.setPageSizeActionCreator(parseInt(event.target.value, 10));
        this.props.setPageNumberActionCreator(1);
        this.setState({
            rowsPerPage: parseInt(event.target.value, 10),
            page: 0,
        });
        // setRowsPerPage(parseInt(event.target.value, 10));
        // setPage(0);
    };

    private generateSqlWhereClause = (filters: any) => {
        let sqlWhereClause = '';
        Object.keys(filters).forEach((filterName) => {
            if (filters[filterName].sql !== '') {
                sqlWhereClause = `${sqlWhereClause} and ${filters[filterName].sql}`;
            }
        });
        return sqlWhereClause !== '' ? ' where ' + sqlWhereClause.substring(4) : '';
    };

    private mapListToFormData = (mapping: MappingObj[], listRowData: { [key: string]: any }): any => {
        const preFormJsn: any = {};
        let metainstanceIdFormField = '';
        mapping.forEach((item: MappingObj) => {
            if (item.column.toLocaleLowerCase() === 'meta_instanceid') metainstanceIdFormField = item.form_field;
            preFormJsn[item.form_field] = listRowData[item.column];
        });
        const metaInstanceId = Object.keys(listRowData).find(
            (item) => item && String(item).toLocaleLowerCase() === 'meta_instanceid',
        );
        if (metaInstanceId) {
            preFormJsn[metainstanceIdFormField] = listRowData[metaInstanceId];
        }
        return btoa(JSON.stringify(preFormJsn));
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
const ConnectedListTable = connect(mapStateToProps, mapDispatchToProps)(ListTable);

export default ConnectedListTable;
