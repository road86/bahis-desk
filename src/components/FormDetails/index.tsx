import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    useTheme,
    makeStyles,
} from '@material-ui/core';
import * as React from 'react';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { listPageStyles } from './style';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { ipcRenderer } from '../../services/ipcRenderer';
import { createFormKeyValuePair } from '../../helpers/formUtils';
import { logger } from '../../helpers/logger';

/** interface for Form URL params */
interface DetailsURLParams {
    id: string;
}

function FormDetails(props: RouteComponentProps<DetailsURLParams>) {
    const [formData, setFormData] = React.useState<any>([]);
    const [userData, setUserData] = React.useState<any>(null);

    const theme = useTheme();
    const useStyles = makeStyles(listPageStyles(theme));
    const classes = useStyles();

    const comUpdate = async () => {
        const { match } = props;
        const dataId = match.params.id || '';

        logger.info(' data id ', dataId);
        const formData = await ipcRenderer.sendSync('form-details', dataId);
        setUserData(formData.formDetails);
        const form_id = formData.formDetails.form_id;
        let data = formData.formDetails.data;
        data = JSON.parse(data);
        const formDefinitionObj = await ipcRenderer.sendSync('fetch-form-definition', form_id);
        const simpleFormChoice = await ipcRenderer.sendSync('fetch-form-choices', form_id);
        logger.info('form choices');
        logger.info(simpleFormChoice.length);
        if (formDefinitionObj != null) {
            const { definition, field_names, formChoices } = formDefinitionObj;
            setFormData(
                createFormKeyValuePair(JSON.parse(definition), JSON.parse(field_names), data, {
                    simpleFormChoice,
                    formChoices: JSON.parse(formChoices),
                }),
            );
        }
        // setFormData(Object.entries(data));
    };

    //TODO
    React.useEffect(() => {
        comUpdate();
    }, []);

    return (
        <div style={{ marginBottom: 20 }}>
            <hr className={classes.hrTag} />
            <div style={{ textAlign: 'center' }}>
                <h3 className={classes.header}> Submitted Form Details </h3>
            </div>
            <hr className={classes.hrTag} />
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                    User Details
                </AccordionSummary>
                <AccordionDetails style={{ display: 'contents' }}>
                    <div style={{ padding: 15 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell key={'col-label-1'} className="initialism text-uppercase text-nowrap">
                                            Date
                                        </TableCell>
                                        <TableCell key={'col-label-2'} className="initialism text-uppercase text-nowrap">
                                            User
                                        </TableCell>
                                        <TableCell key={'col-label-3'} className="initialism text-uppercase text-nowrap">
                                            Details
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell key={'col-label-1'} className="initialism text-uppercase text-nowrap">
                                            {userData != null ? userData.submission_date : ''}
                                        </TableCell>
                                        <TableCell key={'col-label-2'} className="initialism text-uppercase text-nowrap">
                                            {userData != null ? userData.submitted_by : ''}
                                        </TableCell>
                                        <TableCell key={'col-label-3'} className="initialism text-uppercase text-nowrap">
                                            Details
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                    Form Data
                </AccordionSummary>
                <AccordionDetails style={{ display: 'contents' }}>
                    <div style={{ padding: 15 }}>
                        <TableContainer style={{ maxHeight: 400, overflowX: 'hidden' }}>
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
                                                            {rowObj.value}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    );
}

export default withRouter(FormDetails);
