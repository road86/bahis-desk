import { makeStyles, Typography, useTheme } from '@material-ui/core';
import * as React from 'react';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { Button as ReactButton } from 'reactstrap';
import { Accordion, AccordionDetails, AccordionSummary, TextField, MenuItem, Grid } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { listPageStyles } from '../style';
import {
    DATE_FILTER_OPERATORS,
    EQUAL_TYPE,
    GREATER_THAN_EQUAL_TYPE,
    GREATER_THAN_TYPE,
    IN_BETWEEN_TYPE,
    LESS_THAN_EQUAL_TYPE,
    LESS_THAN_TYPE,
    NOT_EQUAL_TYPE,
} from '../../../containers/Filter/Date/constants';
import Select from 'react-select';
import { ipcRenderer } from '../../../services/ipcRenderer';
import moment from 'moment';
import { getFormLabel } from '../../../helpers/utils.tsx';
import { logger } from '../../../helpers/logger';

/** interface for Form URL params */
interface FilterProps {
    userList: any;
    resetFilter: any;
    submitFilter: any;
    tableData: any;
    setUpdater: any;
    fieldNames: any;
    formId: any;
}

function Filter(props: FilterProps) {
    const [condition, setCondition] = React.useState<string>('');
    const [startDate, setStartDate] = React.useState<Date | null>(null);
    const [endDate, setEndDate] = React.useState<Date | null>(null);
    const [submittedBy, setSubmissionBy] = React.useState<string>('');
    const [selectedField, setSelectedField] = React.useState<string>('');
    const [searchText, setSearchText] = React.useState<string>('');

    const resetFilter = () => {
        setCondition('');
        setSubmissionBy('');
        setStartDate(null);
        setEndDate(null);
        setSelectedField('');
        setSearchText('');
        props.resetFilter();
    };

    const submitHandler = async () => {
        props.setUpdater(true);
        // const data = props.tableData;
        let filtered = props.tableData;
        if (searchText !== '' && selectedField !== '') {
            const tableData = await ipcRenderer.sendSync(
                'fetch-list-followup',
                props.formId.toString(),
                selectedField,
                searchText,
                'like',
            );
            filtered = tableData.fetchedRows;
        }
        if (submittedBy) {
            filtered = filtered.filter((obj: any) => obj.submitted_by === submittedBy);
        }
        if (condition && startDate) {
            switch (condition) {
                case GREATER_THAN_TYPE:
                    if (startDate)
                        filtered = filtered.filter((obj: any) =>
                            moment(obj.submission_date).startOf('day').isAfter(moment(startDate).startOf('day')),
                        );
                    break;
                case GREATER_THAN_EQUAL_TYPE:
                    if (startDate)
                        filtered = filtered.filter((obj: any) =>
                            moment(obj.submission_date).startOf('day').isSameOrAfter(moment(startDate).startOf('day')),
                        );
                    break;
                case LESS_THAN_TYPE:
                    if (startDate)
                        filtered = filtered.filter((obj: any) =>
                            moment(obj.submission_date).startOf('day').isBefore(moment(startDate).startOf('day')),
                        );
                    break;
                case LESS_THAN_EQUAL_TYPE:
                    if (startDate)
                        filtered = filtered.filter((obj: any) =>
                            moment(obj.submission_date).startOf('day').isSameOrBefore(moment(startDate).startOf('day')),
                        );
                    break;
                case EQUAL_TYPE:
                    if (startDate)
                        filtered = filtered.filter((obj: any) =>
                            moment(obj.submission_date).startOf('day').isSame(moment(startDate).startOf('day')),
                        );
                    break;
                case NOT_EQUAL_TYPE:
                    if (startDate)
                        filtered = filtered.filter(
                            (obj: any) => !moment(obj.submission_date).startOf('day').isSame(moment(startDate).startOf('day')),
                        );
                    break;
                case IN_BETWEEN_TYPE:
                    if (startDate && endDate) {
                        filtered = filtered.filter(
                            (obj: any) =>
                                moment(obj.submission_date).startOf('day').isSameOrAfter(moment(startDate).startOf('day')) &&
                                moment(obj.submission_date).startOf('day').isSameOrBefore(moment(endDate).startOf('day')),
                        );
                    }
            }
        }
        props.submitFilter(filtered);
    };

    const theme = useTheme();
    const useStyles = makeStyles(listPageStyles(theme));
    const classes = useStyles();

    props.fieldNames
        .filter((ob: any) => getFormLabel(ob.label) !== undefined)
        .map((option: any) => logger.silly(`fieldnames: ${getFormLabel(option.label)}`));

    return (
        <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                Filter
            </AccordionSummary>
            <AccordionDetails>
                <Grid
                    item={true}
                    xs={12}
                    style={{
                        padding: 20,
                        display: 'flex',
                        justifyContent: 'space-between',
                        minHeight: 280,
                        flexDirection: 'column',
                    }}
                >
                    <Grid item={true} xs={10} lg={10} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Grid item={true} lg={5} xl={5} md={5} sm={10} xs={10}>
                            <TextField
                                style={{ display: 'flex' }}
                                select={true}
                                required={true}
                                name={selectedField}
                                label="Select Field Name"
                                variant="outlined"
                                onChange={(e: any) => setSelectedField(e.target.value)}
                                value={selectedField || ''}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {props.fieldNames
                                    .filter((ob: any) => getFormLabel(ob.label) !== undefined)
                                    .map((option: any, index: any) => (
                                        <MenuItem key={index} value={option.value}>
                                            {getFormLabel(option.label)}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Grid>
                        <Grid item={true} lg={6} xl={6} md={6} sm={10} xs={10}>
                            <TextField
                                style={{ display: 'flex' }}
                                required={true}
                                disabled={selectedField === ''}
                                name={searchText}
                                label={`Search ${selectedField.replace('/', ' ').replace('_', ' ').toUpperCase()}`}
                                variant="outlined"
                                onChange={(e: any) => setSearchText(e.target.value)}
                                value={searchText || ''}
                            ></TextField>
                        </Grid>
                    </Grid>
                    <Grid item={true} xs={10}>
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
                            {props.userList.map((option: { username: string; name: string }) => (
                                <MenuItem key={option.username} value={option.username}>
                                    {option.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item={true} xs={12} style={{ display: 'flex' }}>
                        <Grid item={true} xs={3}>
                            <Typography variant="body1" color="textSecondary" align="left" style={{ marginTop: 2 }}>
                                Submission Date
                            </Typography>
                        </Grid>
                        <Grid item={true} xs={3} style={{ paddingRight: 20 }}>
                            <Select
                                options={DATE_FILTER_OPERATORS}
                                values={DATE_FILTER_OPERATORS.filter((filterObj) => filterObj.value === condition)}
                                onChange={(obj: any) => setCondition(obj.value)}
                            />
                        </Grid>
                        <Grid item={true} xs={3} style={{ paddingRight: 20 }}>
                            <KeyboardDatePicker
                                value={startDate}
                                onChange={(date: any) => setStartDate(date)}
                                format="MM/dd/yyyy"
                            />
                        </Grid>
                        {condition === IN_BETWEEN_TYPE && (
                            <Grid item={true} xs={3}>
                                <KeyboardDatePicker
                                    value={endDate}
                                    onChange={(date: any) => setEndDate(date)}
                                    format="MM/dd/yyyy"
                                />
                            </Grid>
                        )}
                    </Grid>
                    <Grid item={true} xs={10}>
                        <ReactButton className={classes.submitButton} size="sm" onClick={submitHandler}>
                            Submit
                        </ReactButton>
                        <ReactButton className={classes.resetButton} size="sm" onClick={resetFilter}>
                            Reset
                        </ReactButton>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}

export default Filter;
