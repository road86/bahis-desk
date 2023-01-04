import { AccordionActions, makeStyles, TablePagination, TableSortLabel, useTheme } from '@material-ui/core';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, TableContainer, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
// import { Button as ReactButton } from 'reactstrap';
// import ListTable from '../../containers/ListTable';
import { ipcRenderer } from '../../services/ipcRenderer';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { listPageStyles } from './style';
import { Link } from 'react-router-dom';
import { ActionColumnObj, ActionDefinition, ColumnObj, isColumnObj } from '../../containers/ListTable';
// import OrderBy from '../../containers/ListTable/OrderBy';
import Typist from 'react-typist';
import Loader from 'react-loader-spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { exportToExcelForSubmittedData, getFormLabel } from '../../helpers/utils';
import Filter from './Filter';
import { makeLabelColumnPair } from '../../helpers/formUtils';

/** interface for Form URL params */
interface ListURLParams {
  id: string;
}

/** interface for List props */
interface ListProps extends RouteComponentProps<ListURLParams> {
  appLanguage: string;
}

type Order = 'asc' | 'desc';

function SubmittedForm(props: ListProps) {
  const [formId, setFormId] = React.useState<string>('');
  const [tableData, setTableData] = React.useState<any>([]);
  const [filteredData, setFilteredData] = React.useState<any>([]);
  const [columnDefinition, setColumnDefinition] = React.useState([]);
  const [updating, setUpdating] = React.useState<boolean>(true);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);
  const [page, setPage] = React.useState<number>(0);
  const [userList, setUserList] = React.useState<any[]>([]);
  const [fieldNames, setFieldNames] = React.useState<any[]>([]);
  const [order, setOrder] = React.useState<Order>('desc');
  const [fieldWithLabels, setFieldWithLabels] = React.useState<any>({});
  const [formAllChoices, setFormAllChoices] = React.useState<any>({});




  const constructFieldWithLabel = (ob: any, parent: any): any => {
    if (parent === '/') parent = '';

    let labels = {};
    for (let i = 0; i < ob.children.length; i++) {
      if (ob.children[i].type === "group")
        labels = { ...labels, ...constructFieldWithLabel(ob.children[i], `${parent}${ob.name}/`) };
      else {
        if (ob.children[i].label) {
          labels = {
            ...labels,
            [`${parent}${ob.name}/${ob.children[i].name}`]: {
              label: getFormLabel(ob.children[i].label),
              type: ob.children[i].type,
              fieldElement: ob.children[i],
            }
          }
        }
        else {
          labels = { ...labels, ...{ [`${parent}${ob.name}/${ob.children[i].name}`]: ob.children[i].name } }
        }
      }
    }
    return labels;
  }

  const comUpdate = async () => {
    const { match } = props;
    const formId = match.params.id || '';
    console.log('---------> form id: ', formId);
    const formDefinitionObj = await ipcRenderer.sendSync('fetch-form-definition', formId);
    const simpleFormChoice = await ipcRenderer.sendSync('fetch-form-choices', formId);

    if (formDefinitionObj != null) {
      const { field_names, formChoices, definition } = formDefinitionObj;
      const form = { name: '', children: JSON.parse(formDefinitionObj.definition).children }
      const result = constructFieldWithLabel(form, "");
      setFieldWithLabels(result);

      const labelColumnPair = makeLabelColumnPair(JSON.parse(definition), JSON.parse(field_names));
      console.log('----------> Label Column Pair: ', labelColumnPair);

      setFieldNames(labelColumnPair);
      setFormAllChoices({ simpleFormChoice, formChoices: JSON.parse(formChoices) })
    }
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
    setTableData(tableData.fetchedRows);
    setFilteredData(tableData.fetchedRows);
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
        "sortable": false,
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
        "sortable": false,
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
        "sortable": false,
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
        "sortable": false,
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
  }

  const deleteData = (instanceId: string) => {
    setUpdating(true);
    ipcRenderer.sendSync(
      'delete-instance',
      instanceId, formId
    );
    fetchTableData(formId);
  }

  React.useEffect(() => {
    comUpdate()
  }, [])

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log(event);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const resetFilter = () => {
    setFilteredData(tableData)
  }

  const filterData = (data: any) => {
    setFilteredData(data);
    setUpdating(false);
  }

  function stableSort<T>(array: T[]) {
    let stabilizedThis;
    if (order === 'asc') {
      stabilizedThis = array.sort((a: any, b: any) => new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime())
    } else {
      stabilizedThis = array.sort((a: any, b: any) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
    }
    return stabilizedThis;
  }

  const theme = useTheme();
  const useStyles = makeStyles(listPageStyles(theme));
  const classes = useStyles();

  const { appLanguage } = props;

  const handleRequestSort = () => {
    const isAsc = order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
  };

  return (
    <div>
      <hr className={classes.hrTag} />
      <div style={{ textAlign: 'center' }}>
        <h3 className={classes.header}> Submitted List </h3>
      </div>
      <hr className={classes.hrTag} />
      <Filter formId={formId} fieldNames={fieldNames} tableData={tableData} userList={userList} submitFilter={filterData} resetFilter={resetFilter} setUpdater={setUpdating}></Filter>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button style={{ backgroundColor: '#8ac390', borderColor: '#8ac390', margin: 10 }} onClick={() => exportToExcelForSubmittedData(tableData, fieldWithLabels, formAllChoices)}>
          <FontAwesomeIcon icon={['fas', 'long-arrow-alt-down']} /> Export to XLSX
        </Button>
      </div>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}
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
                                <TableSortLabel
                                  active={singleCol.sortable}
                                  direction={singleCol.sortable ? order : 'asc'}
                                  className="sortable-column"
                                  onClick={handleRequestSort}
                                >
                                  {singleCol.label[appLanguage]}
                                  {/* {orderBy === headCell.id ? (
                                  <span className={classes.visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                  </span>
                                ) : null} */}
                                </TableSortLabel>

                              </TableCell>
                            );
                          } else {
                            return (
                              <TableCell colSpan={singleCol.action_definition.length} key={'col-label-' + index} style={{ textAlign: 'center' }} className="initialism text-uppercase text-nowrap">
                                {singleCol.label[appLanguage]}
                              </TableCell>
                            );
                          }
                        })}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData && stableSort(filteredData).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((rowObj: any, rowIndex: number) => (
                          <TableRow key={'table-row-' + rowIndex}>
                            {columnDefinition.filter((col: ColumnObj | ActionColumnObj) => col.hidden === false).map((colObj: ColumnObj | ActionColumnObj, colIndex: number) =>
                              isColumnObj(colObj) ? (
                                <TableCell key={'data-field-' + colIndex}>
                                  {rowObj[colObj.field_name]}
                                </TableCell>
                              ) : (
                                <TableCell key={'data-field-' + colIndex} colSpan={colObj.action_definition.length} style={{ display: 'flex', justifyContent: 'center' }}>
                                  {colObj.action_definition.map((actionObj: ActionDefinition, actionIndex: number) => {
                                    if (rowObj['status'] === 0 && (actionObj.form_title === 'edit' || actionObj.form_title === 'delete')) {
                                      if (actionObj.form_title === 'edit') {
                                        return (
                                          <Link key={'action-field' + actionIndex} to={actionObj.formData !== undefined ? `/form/${actionObj.xform_id}/?dataJson=${btoa(rowObj[actionObj.formData])}` : '/'}
                                          >
                                            <Button variant="contained" color={'secondary'} style={{ color: '#EBFDED', marginRight: 5, whiteSpace: 'nowrap' }}> {actionObj.label[appLanguage]} </Button>
                                          </Link>
                                        )
                                      } else {
                                        return (
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
                                    } else if (actionObj.form_title === 'view') {
                                      return (
                                        <Link key={'action-field' + actionIndex} to={actionObj.formData !== undefined ? `/submittedDetails/${rowObj.data_id}` : '/'}
                                        >
                                          <Button variant="contained" color={'secondary'} style={{ color: '#EBFDED', marginRight: 5, whiteSpace: 'nowrap' }}> {actionObj.label[appLanguage]} </Button>
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </AccordionActions>
      </Accordion>
    </div>
  );
}

export default withRouter(SubmittedForm);
