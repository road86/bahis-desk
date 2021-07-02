import { AccordionActions, makeStyles, TablePagination, useTheme } from '@material-ui/core';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import {
  KeyboardDatePicker,
} from '@material-ui/pickers';
import { Button as ReactButton } from 'reactstrap';
import { Accordion, AccordionDetails, AccordionSummary, TableContainer, Button, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Grid } from '@material-ui/core';
// import { Col, Row } from 'reactstrap';
// import ListTable from '../../containers/ListTable';
import { ipcRenderer } from '../../services/ipcRenderer';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { listPageStyles } from './style';
import { Link } from 'react-router-dom';
import { ActionColumnObj, ActionDefinition, ColumnObj, isColumnObj } from '../../containers/ListTable';
import OrderBy from '../../containers/ListTable/OrderBy';
import Typist from 'react-typist';
import Loader from 'react-loader-spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { exportToExcel } from '../../helpers/utils';
import moment from 'moment';

/** interface for Form URL params */
interface ListURLParams {
  id: string;
}

/** interface for List props */
interface ListProps extends RouteComponentProps<ListURLParams> {
  appLanguage: string;
}

function SubmittedForm(props: ListProps) {
  const [formId, setFormId] = React.useState<string>('');
  const [tableData, setTableData] = React.useState<any>([]);
  const [columnDefinition, setColumnDefinition] = React.useState([]);
  const [updating, setUpdating] = React.useState<boolean>(true);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);
  const [page, setPage] = React.useState<number>(0);
  const [exportableColumn, setExportableColumn] = React.useState([]);
  const [submissionDate, setSubmissionDate] = React.useState<Date | null>(null);
  const [submittedBy, setSubmissionBy] = React.useState<string>('');
  const [userList, setUserList] = React.useState<any[]>([]);

  const comUpdate = async () => {
    const { match } = props;
    const formId = match.params.id || '';
    fetchTableData(formId);
    setFormId(formId);
    updateColumnDefinition(formId);
    const userList: any = await ipcRenderer.sendSync('fetch-userlist');
    setUserList(userList.users);
  } 

  const fetchTableData = async (formId: string) => {
    const tableData = await ipcRenderer.sendSync(
      'submitted-form-definition',
      formId,
    );
    console.log(tableData);
    setTableData(tableData.fetchedRows);
    setUpdating(false);
  }

  const updateColumnDefinition = (xform_id: any) => {
    const COLUMN_DEFINITION: any = [
      {
        "exportable": true,
        "data_type": "text",
        "format": "",
        "label": {
          "Bangla": "ID",
          "English": "ID"
        },
        "sortable": true,
        "hidden": false,
        "field_name": "data_id"
      },
      {
        "exportable": true,
        "data_type": "text",
        "format": "",
        "label": {
          "Bangla": "Submitted By",
          "English": "Submitted By"
        },
        "sortable": true,
        "hidden": false,
        "field_name": "submitted_by"
      },
      {
        "exportable": true,
        "data_type": "text",
        "format": "",
        "label": {
          "Bangla": "Submission Date",
          "English": "Submission Date"
        },
        "sortable": true,
        "hidden": false,
        "field_name": "submission_date",
      },
      {
        "exportable": true,
        "data_type": "text",
        "format": "",
        "label": {
          "Bangla": "Data",
          "English": "Data"
        },
        "sortable": true,
        "hidden": true,
        "field_name": "data"
      },
      {
        "exportable": true,
        "data_type": "text",
        "format": "",
        "label": {
          "Bangla": "Status",
          "English": "Status"
        },
        "sortable": true,
        "hidden": true,
        "field_name": "status"
      },
      {
        "action_definition": [
          {
            "xform_id": xform_id,
            "form_title": "edit",
            "data_mapping": [],
            "action_type": "form_entry",
            "label": {
              "Bangla": "EDIT",
              "English": "EDIT"
            },
            "formData": "data",
          },
          {
            "xform_id": xform_id,
            "form_title": "delete",
            "data_mapping": [],
            "action_type": "form_entry",
            "label": {
              "Bangla": "DELETE",
              "English": "DELETE"
            },
            "formData": "data",
          },
          {
            "xform_id": xform_id,
            "form_title": "view",
            "data_mapping": [],
            "action_type": "form_entry",
            "label": {
              "Bangla": "Details",
              "English": "Details"
            },
            "formData": "data",
          }
        ],
        "data_type": "action",
        "label": {
          "Bangla": "Action",
          "English": "Action"
        },
        "hidden": false,
      }
    ];
    setColumnDefinition(COLUMN_DEFINITION);
    const filterColumns = COLUMN_DEFINITION.filter((tmp: any) => isColumnObj(tmp) && tmp.exportable == true);
    setExportableColumn(filterColumns)
  }

  const deleteData = (instanceId: string) =>{
    setUpdating(true);
    console.log(instanceId);
    ipcRenderer.sendSync(
      'delete-instance',
      instanceId, formId
    );
    setTimeout(() => {
      fetchTableData(formId);
    }, 3000);
  }

  React.useEffect(() => {
    comUpdate()
  }, [])

  const handleChangePage = (event: unknown, newPage: number) => {
    // setPage(newPage);
    console.log(event);
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

  const resetFilter = () => {
    setSubmissionBy('');
    setSubmissionDate(null);
  }

  const filterData = () => {
    setUpdating(true);
    const date = submissionDate ? moment(submissionDate).format('YYYY-MM-DD'): '';
    const table = tableData.filter((obj: any) => obj.submitted_by == submittedBy && moment(obj.submission_date).format('YYYY-MM-DD') == date); 
    setTableData(table);
    console.log(date, table);
    setUpdating(false);
  }

  console.log(formId);

  const theme = useTheme();
  const useStyles = makeStyles(listPageStyles(theme));
  const classes = useStyles();

  const {appLanguage} = props;
  console.log(exportableColumn);

  return (
    <div>
      <hr className={classes.hrTag}/>
        <div style={{ textAlign: 'center' }}>
        <h3 className={classes.header}> Submitted List </h3>
      </div>
      <hr className={classes.hrTag}/>
      <Accordion defaultExpanded>
        <AccordionSummary  expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            >
                Filter
        </AccordionSummary>
        <AccordionDetails style={{ display: 'contents', justifyContent: 'flex-start' }}>
          <Grid item={true} xs={12}>
            <Grid item={true} xs={10} style={{ padding: 20 }}>
              <TextField
                style={{ display: 'flex' }}
                select={true}
                required={true}
                name={submittedBy}
                label="Submitted By"
                variant="outlined"
                onChange={(e: any) => setSubmissionBy(e.target.value)}
                value={submittedBy || ''}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {userList.map((option: { username: string; name: string }) => (
                  <MenuItem key={option.username} value={option.username}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item={true} xs={10} style={{ padding: 20, paddingTop: 0 }}>
                <KeyboardDatePicker
                  className={classes.root}
                  inputProps={{ className: classes.root }}
                  value={submissionDate}
                  onChange={(date: any) => setSubmissionDate(date)}
                  format="MM/dd/yyyy"
                />
            </Grid>
            <Grid item={true} xs={10} style={{ padding: 20, paddingTop: 0 }}>
              <ReactButton className={classes.submitButton} size="sm" onClick={filterData}>
                Submit
              </ReactButton>
              <ReactButton className={classes.resetButton} size="sm" onClick={resetFilter}>
                Reset
              </ReactButton>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button style={{ backgroundColor: '#8ac390', borderColor: '#8ac390', margin: 10}} onClick={() => exportToExcel(tableData, exportableColumn, appLanguage)}>
          <FontAwesomeIcon icon={['fas', 'long-arrow-alt-down']}/> Export to XLSX
        </Button>
      </div>
      <Accordion defaultExpanded>
        <AccordionSummary  expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            >
                ListTable
        </AccordionSummary>
        <AccordionDetails style={{ display: 'contents', justifyContent: 'flex-start' }}>
          {
            updating ? <div style={{ marginTop: '2%', textAlign: 'center' }}>
            <Loader
              type="Puff"
              color={theme.palette.primary.dark}
              height={40}
              width={100}
              timeout={3000} // 3 secs
            />
            <Typist cursor={{ hideWhenDone: true }}>
              <span className="loader-title"> BAHIS </span>
              <br />
              <span className="loader-subtitle">
                Updating Data Table
              </span>
            </Typist>
          </div> : 
            <div style={{ padding: 15 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {columnDefinition.filter((col: ColumnObj | ActionColumnObj) => col.hidden === false).map((singleCol: ColumnObj | ActionColumnObj, index: number) => {
                      if (isColumnObj(singleCol)) {
                        return (
                          <TableCell key={'col-label-' + index} className="initialism text-uppercase text-nowrap">
                            {singleCol.sortable ? (
                              <OrderBy colDefifinitionObj={singleCol} appLanguage={appLanguage} />
                            ) : (
                              singleCol.label[appLanguage]
                            )}
                          </TableCell>
                        );
                      } else {
                        return (
                          <TableCell  colSpan={singleCol.action_definition.length } key={'col-label-' + index} style={{ textAlign: 'center' }} className="initialism text-uppercase text-nowrap">
                            {singleCol.label[appLanguage]}
                          </TableCell>
                        );
                      }
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableData && tableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((rowObj: any, rowIndex: number) => (
                      <TableRow key={'table-row-' + rowIndex}>
                        {columnDefinition.filter((col: ColumnObj | ActionColumnObj) => col.hidden === false).map((colObj: ColumnObj | ActionColumnObj, colIndex: number) =>
                          isColumnObj(colObj) ? (
                            <TableCell key={'data-field-' + colIndex}>
                              {rowObj[colObj.field_name]}
                            </TableCell>
                          ) : (
                            <TableCell key={'data-field-' + colIndex} colSpan={colObj.action_definition.length } style={{ display: 'flex', justifyContent: 'center' }}>
                              {colObj.action_definition.map((actionObj: ActionDefinition, actionIndex: number) => {
                                if (rowObj['status'] === 0 && (actionObj.form_title === 'edit' || actionObj.form_title === 'delete')) {
                                  if (actionObj.form_title === 'edit') {
                                    return(
                                      <Link key={'action-field' + actionIndex} to={actionObj.formData != undefined ? `/form/${actionObj.xform_id}/?dataJson=${btoa(rowObj[actionObj.formData])}`: '/'}
                                      >
                                        <Button  variant="contained" color={'secondary'} style={{ color: '#EBFDED', marginRight: 5, whiteSpace: 'nowrap' }}> {actionObj.label[appLanguage]} </Button>
                                      </Link>
                                    )
                                  } else {
                                    return(
                                      <Button 
                                        key={'action-field' + actionIndex}  
                                        variant="contained" 
                                        onClick={() => deleteData(rowObj['instanceid'].toString())}
                                        color={'secondary'} 
                                        style={{ color: '#EBFDED', marginRight: 5, whiteSpace: 'nowrap' }}> 
                                        {actionObj.label[appLanguage]} 
                                      </Button>
                                    )
                                  }
                                } else if(actionObj.form_title === 'view'){
                                  return(
                                    <Link key={'action-field' + actionIndex} to={actionObj.formData != undefined ? `/submittedDetails/${rowObj.data_id}`: '/'}
                                    >
                                      <Button  variant="contained" color={'secondary'} style={{ color: '#EBFDED', marginRight: 5, whiteSpace: 'nowrap' }}> {actionObj.label[appLanguage]} </Button>
                                    </Link>
                                  )
                                }
                              })}
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          }
        </AccordionDetails>
        <AccordionActions>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={tableData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </AccordionActions>
      </Accordion>
    </div>
  );
}

export default withRouter(SubmittedForm);