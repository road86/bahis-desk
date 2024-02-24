import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    useTheme,
    makeStyles,
    TableBody,
} from '@material-ui/core';
import * as React from 'react';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { listPageStyles } from './style';
import { RouteComponentProps, withRouter } from 'react-router-dom';
// import { ipcRenderer } from '../../services/ipcRenderer';
import queryString from 'query-string';
import { ipcRenderer } from '../../services/ipcRenderer';
import { ActionDefinition } from '../../containers/ListTable';
import FollowUpTable from './DataTable';
import { createFormKeyValuePair } from '../../helpers/formUtils.ts';
import { logger } from '../../helpers/logger';

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

    const comUpdate = async () => {
        const { match } = props;
        const listId = match.params.id || '';
        const dataJson = queryString.parse(props.location.search).dataJson;
        const detailspk = queryString.parse(props.location.search).detailspk;
        //TODO remove xFormId is not used is it?
        //const xFormId = queryString.parse(props.location.search).xform_id;
        const formData = dataJson && typeof dataJson === 'string' ? JSON.parse(atob(dataJson)) : null;
        const details = detailspk && typeof detailspk === 'string' ? detailspk : '';

        const viewFormData = await ipcRenderer.sendSync('form-details', formData.instanceid, 'instanceid');

        logger.info('viewFormData: ', viewFormData);
        const formDefinitionObj = await ipcRenderer.sendSync('fetch-form-definition', viewFormData.formDetails.form_id);
        const simpleFormChoice = await ipcRenderer.sendSync('fetch-form-choices', viewFormData.formDetails.form_id);

        if (viewFormData != null) {
            const { definition, field_names, formChoices } = formDefinitionObj;
            let { data } = viewFormData.formDetails;
            data = JSON.parse(data);
            setFormData(
                createFormKeyValuePair(JSON.parse(definition), JSON.parse(field_names), data, {
                    simpleFormChoice,
                    formChoices: JSON.parse(formChoices),
                }),
            );
        }

        setDetailsPk(details);
        setDetailsPkValue(formData[details]);

        const { columnDefinition } = await ipcRenderer.sendSync('fetch-list-definition', listId);
        const definition = JSON.parse(columnDefinition);
        const action = definition.find((obj: any) => obj.data_type === 'action');
        setActionDefinition(action ? action.action_definition : []);
    };

    //TODO ?!?!?!?!?!??!?
    React.useEffect(() => {
        logger.info(' i am in the correct component. ');
        comUpdate();
    }, []);

    logger.info('form data: ', formData);
    return (
        <div style={{ marginBottom: 20 }}>
            <hr className={classes.hrTag} />
            <div style={{ textAlign: 'center' }}>
                <h3 className={classes.header}> List Profile </h3>
            </div>
            <hr className={classes.hrTag} />
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
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
                                    {formData.length &&
                                        formData.map((rowObj: any, index: number) => {
                                            if (rowObj.label) {
                                                return (
                                                    <TableRow>
                                                        <TableCell
                                                            key={'col-label-1' + index}
                                                            style={{ verticalAlign: 'baseline' }}
                                                        >
                                                            {typeof rowObj.label === 'object'
                                                                ? rowObj.label['English']
                                                                : rowObj.label}
                                                        </TableCell>
                                                        <TableCell
                                                            key={'col-label-2' + index}
                                                            className="initialism text-uppercase"
                                                            style={{ wordBreak: 'break-word' }}
                                                        >
                                                            {rowObj.value == null ? '--' : rowObj.value}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            } else return <></>;
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </AccordionDetails>
            </Accordion>
            {actionDefinition ? (
                actionDefinition.map((actionObj: ActionDefinition, actionIndex: number) => {
                    if (actionObj.data_mapping.length && actionObj.data_mapping.find((obj: any) => obj.column === detailsPk)) {
                        return (
                            <FollowUpTable
                                key={actionIndex}
                                formTitle={actionObj.label}
                                detailsPk={actionObj.data_mapping.find((obj: any) => obj.column === detailsPk)}
                                detailsPkValue={detailsPkValue}
                                formId={actionObj.xform_id}
                                appLanguage={'English'}
                            ></FollowUpTable>
                        );
                    }
                })
            ) : (
                <React.Fragment></React.Fragment>
            )}
        </div>
    );
}

export default withRouter(ListProfile);
