import { Accordion, AccordionDetails, AccordionSummary, TableContainer, Table, TableHead, TableRow, TableCell, useTheme, makeStyles, TableBody } from '@material-ui/core';
import * as React from 'react';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { listPageStyles } from '../List/style';
import { RouteComponentProps, withRouter } from 'react-router-dom';
// import { ipcRenderer } from '../../services/ipcRenderer';
import queryString from 'query-string';
import { ipcRenderer } from '../../services/ipcRenderer';
import { ActionDefinition } from '../../containers/ListTable';
import FollowUpTable from './DataTable';



/** interface for Form URL params */
interface DetailsURLParams {
  id: string;
}


function ListProfile(props: RouteComponentProps<DetailsURLParams>) {
  const [formData, setFormData] = React.useState<any>([]);
  const [detailsPk, setDetailsPk] = React.useState<string>('');
  const [actionDefinition, setActionDefinition] = React.useState<ActionDefinition[]>([]);
  const [detailsPkValue, setDetailsPkValue] = React.useState<string>('');

  const theme = useTheme();
  const useStyles = makeStyles(listPageStyles(theme));
  const classes = useStyles();

  const comUpdate = async() => {
    const { match } = props;
    const listId = match.params.id || '';
    const dataJson = queryString.parse(props.location.search).dataJson;
    const detailspk = queryString.parse(props.location.search).detailspk;
    const formData = dataJson && typeof dataJson === 'string' ? JSON.parse(atob(dataJson)) : null;
    const details = detailspk && typeof detailspk === 'string' ? detailspk : '';
    setDetailsPk(details);
    setDetailsPkValue(formData[details]);
    setFormData(Object.entries(formData));
    const { columnDefinition } = await ipcRenderer.sendSync(
      'fetch-list-definition',
      listId,
    );
    const definition = JSON.parse(columnDefinition);
    const action = definition.find((obj: any) => obj.data_type === 'action');
    setActionDefinition(action ? action.action_definition : []); 
  }

  React.useEffect(()=> {
      comUpdate();
  }, []);
  
  return (
    <div style={{ marginBottom: 20 }}>
      <hr className={classes.hrTag}/>
      <div style={{ textAlign: 'center' }}>
        <h3 className={classes.header}> List Profile </h3>
      </div>
      <hr className={classes.hrTag}/>
      <Accordion defaultExpanded>
        <AccordionSummary  expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            >
                List Data
        </AccordionSummary>
        <AccordionDetails style={{ display: 'contents' }}>
          <div style={{ padding: 15 }}>
            <TableContainer className={classes.container}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell key={'col-label-1'} className="initialism text-uppercase text-nowrap">
                      Attribute Name
                    </TableCell>
                    <TableCell key={'col-label-2'} className="initialism text-uppercase text-nowrap">
                      Attribut Value
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData && formData.length && formData.map((rowObj:any, index: number) => {
                      return (
                        <React.Fragment key={'body_' + index}>
                          {rowObj[1] && (
                            <TableRow>
                            <TableCell key={'col-label-1'} className="initialism text-uppercase text-nowrap">
                              {rowObj[0].replace('_', ' ')}
                            </TableCell>
                            <TableCell key={'col-label-2'} className="initialism text-uppercase text-nowrap">
                              {typeof rowObj[1] == 'string' ? rowObj[1] : JSON.stringify(rowObj[1])}
                            </TableCell>
                          </TableRow>  
                          )}
                        </React.Fragment>
                      )
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </AccordionDetails>
      </Accordion>
      { actionDefinition ? actionDefinition.map((actionObj: ActionDefinition, actionIndex: number) => {
          if (actionObj.data_mapping.length && actionObj.data_mapping.find((obj: any) => obj.column === detailsPk)) {
            return <FollowUpTable
            key={actionIndex}
            formTitle={actionObj.label}
            detailsPk={actionObj.data_mapping.find((obj: any) => obj.column === detailsPk)}
            detailsPkValue={detailsPkValue}
            formId={actionObj.xform_id}
            appLanguage={'English'}
          ></FollowUpTable>
          }
        }) : <React.Fragment></React.Fragment>}
    </div>
  );
}

export default withRouter(ListProfile);
