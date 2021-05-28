import { makeStyles, useTheme } from '@material-ui/core';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, TableContainer, Button,  Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
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

  const comUpdate = async () => {
    const { match } = props;
    const formId = match.params.id || '';
    fetchTableData(formId);
    setFormId(formId);
    updateColumnDefinition(formId);
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
        }
      }
    ];
    setColumnDefinition(COLUMN_DEFINITION);
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

  // const { appLanguage } = props;
  console.log(formId);

  const theme = useTheme();
  const useStyles = makeStyles(listPageStyles(theme));
  const classes = useStyles();

  const {appLanguage} = props;

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
                      {columnDefinition.map((singleCol: ColumnObj | ActionColumnObj, index: number) => {
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
                    {tableData &&
                      tableData.map((rowObj: any, rowIndex: number) => (
                        <TableRow key={'table-row-' + rowIndex}>
                          {columnDefinition.map((colObj: ColumnObj | ActionColumnObj, colIndex: number) =>
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
                                      <Link key={'action-field' + actionIndex} to={actionObj.formData != undefined ? `/form/${actionObj.xform_id}/?dataJson=${btoa(rowObj[actionObj.formData])}`: '/'}
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
          {/* <AccordionActions>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={this.state.tableData.length}
              rowsPerPage={this.state.rowsPerPage}
              page={this.state.page}
              onChangePage={this.handleChangePage}
              onChangeRowsPerPage={this.handleChangeRowsPerPage}
            />
          </AccordionActions> */}
        </Accordion>
    </div>
  );
}

export default withRouter(SubmittedForm);