import * as React from 'react';
import { Link } from 'react-router-dom';
import {
    AccordionActions,
    TablePagination,
    Accordion,
    AccordionDetails,
    AccordionSummary,
    TableContainer,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { ActionColumnObj, ActionDefinition, ColumnObj, isColumnObj } from '../../../containers/ListTable';
import OrderBy from '../../../containers/ListTable/OrderBy';
import { ipcRenderer } from '../../../services/ipcRenderer';
import { logger } from '../../../helpers/logger';

/** interface for List props */
interface ListProps {
    formId: number;
    detailsPk: any;
    detailsPkValue: string;
    appLanguage: string;
    formTitle: any;
}

function FollowUpTable(props: ListProps) {
    const [tableData, setTableData] = React.useState<any>([]);
    const [columnDefinition, setColumnDefinition] = React.useState([]);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);
    const [page, setPage] = React.useState<number>(0);

    const comUpdate = async () => {
        fetchTableData(props.formId);
        updateColumnDefinition(props.formId);
    };

    const fetchTableData = async (formId: number) => {
        const tableData = await ipcRenderer.sendSync(
            'fetch-list-followup',
            formId.toString(),
            props.detailsPk.form_field,
            props.detailsPkValue,
            'equal',
        );
        setTableData(tableData.fetchedRows);
    };

    const updateColumnDefinition = (xform_id: any) => {
        const COLUMN_DEFINITION: any = [
            {
                exportable: true,
                data_type: 'text',
                format: '',
                label: {
                    Bangla: 'ID',
                    English: 'ID',
                },
                sortable: true,
                hidden: false,
                field_name: 'data_id',
            },
            {
                exportable: true,
                data_type: 'text',
                format: '',
                label: {
                    Bangla: 'Submitted By',
                    English: 'Submitted By',
                },
                sortable: true,
                hidden: false,
                field_name: 'submitted_by',
            },
            {
                exportable: true,
                data_type: 'text',
                format: '',
                label: {
                    Bangla: 'Submission Date',
                    English: 'Submission Date',
                },
                sortable: true,
                hidden: false,
                field_name: 'submission_date',
            },
            {
                exportable: true,
                data_type: 'text',
                format: '',
                label: {
                    Bangla: 'Data',
                    English: 'Data',
                },
                sortable: true,
                hidden: true,
                field_name: 'data',
            },
            {
                exportable: true,
                data_type: 'text',
                format: '',
                label: {
                    Bangla: 'Status',
                    English: 'Status',
                },
                sortable: true,
                hidden: true,
                field_name: 'status',
            },
            {
                action_definition: [
                    {
                        xform_id: xform_id,
                        form_title: 'view',
                        data_mapping: [],
                        action_type: 'form_entry',
                        label: {
                            Bangla: 'Details',
                            English: 'Details',
                        },
                        formData: 'data',
                    },
                ],
                data_type: 'action',
                label: {
                    Bangla: 'Action',
                    English: 'Action',
                },
                hidden: false,
            },
        ];
        setColumnDefinition(COLUMN_DEFINITION);
    };

    React.useEffect(() => {
        comUpdate();
    }, []);

    const handleChangePage = (event: unknown, newPage: number) => {
        // setPage(newPage);
        logger.info(event);
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        // this.setState({
        //   rowsPerPage: parseInt(event.target.value, 10),
        //   page: 0,
        // });
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const { appLanguage } = props;

    return (
        <React.Fragment>
            {tableData && tableData.length ? (
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                        {props.formTitle[appLanguage]}
                    </AccordionSummary>
                    <AccordionDetails style={{ display: 'contents', justifyContent: 'flex-start' }}>
                        <TableContainer style={{ padding: 15 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {columnDefinition
                                            .filter((col: ColumnObj | ActionColumnObj) => col.hidden === false)
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
                                    {tableData ? (
                                        tableData
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((rowObj: any, rowIndex: number) => (
                                                <TableRow key={'table-row-' + rowIndex}>
                                                    {columnDefinition
                                                        .filter((col: ColumnObj | ActionColumnObj) => col.hidden === false)
                                                        .map((colObj: ColumnObj | ActionColumnObj, colIndex: number) =>
                                                            isColumnObj(colObj) ? (
                                                                <TableCell key={'data-field-' + colIndex}>
                                                                    {rowObj[colObj.field_name]}
                                                                </TableCell>
                                                            ) : (
                                                                <TableCell
                                                                    key={'data-field-' + colIndex}
                                                                    colSpan={colObj.action_definition.length}
                                                                    style={{ display: 'flex', justifyContent: 'center' }}
                                                                >
                                                                    {colObj.action_definition.map(
                                                                        (actionObj: ActionDefinition, actionIndex: number) => {
                                                                            return (
                                                                                <Link
                                                                                    key={'action-field' + actionIndex}
                                                                                    to={
                                                                                        actionObj.formData !== undefined
                                                                                            ? `/submittedDetails/${rowObj.data_id}`
                                                                                            : '/'
                                                                                    }
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
                                                                                        {actionObj.label[appLanguage]}{' '}
                                                                                    </Button>
                                                                                </Link>
                                                                            );
                                                                        },
                                                                    )}
                                                                </TableCell>
                                                            ),
                                                        )}
                                                </TableRow>
                                            ))
                                    ) : (
                                        <React.Fragment></React.Fragment>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                    <AccordionActions>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={tableData.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </AccordionActions>
                </Accordion>
            ) : (
                <React.Fragment></React.Fragment>
            )}
        </React.Fragment>
    );
}

export default FollowUpTable;
