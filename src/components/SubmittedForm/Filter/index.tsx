import { makeStyles, useTheme } from '@material-ui/core';
import * as React from 'react';
import {
  KeyboardDatePicker,
} from '@material-ui/pickers';
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
    NOT_EQUAL_TYPE
} from '../../../containers/Filter/Date/constants';
import Select from 'react-select';

/** interface for Form URL params */
interface FilterProps {
  userList: any;
  resetFilter: any;
  submitFilter: any;
  tableData: any;
  setUpdater: any;
}

function Filter(props: FilterProps) {
  const [condition, setCondition] = React.useState<string>('');
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [submittedBy, setSubmissionBy] = React.useState<string>('');

  const resetFilter = () => {
    setCondition('');
    setSubmissionBy('');
    setStartDate(null);
    setEndDate(null);
    props.resetFilter();
  }

  const submitHandler = () => {
    props.setUpdater(true)
    const data = props.tableData;
    let filterd = [];
    if (startDate) console.log(data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date > startDate.toISOString()));
    switch (condition) {
        case GREATER_THAN_TYPE:
            if (startDate) filterd = data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date > startDate.toISOString());
            break
        case GREATER_THAN_EQUAL_TYPE:
            if (startDate) filterd = data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date >= startDate.toISOString());
            break
        case LESS_THAN_TYPE:
            if (startDate) filterd = data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date < startDate.toISOString());
            break
        case LESS_THAN_EQUAL_TYPE:
            if (startDate) filterd = data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date <= startDate.toISOString());
            break
        case EQUAL_TYPE:
            if (startDate) filterd = data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date == startDate.toISOString());
            break
        case NOT_EQUAL_TYPE:
            if (startDate) filterd = data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date != startDate.toISOString());
            break
        case IN_BETWEEN_TYPE:
          if (startDate && endDate) {
            filterd = data.filter((obj: any) => obj.submitted_by == submittedBy && obj.submission_date >= startDate.toISOString() && obj.submission_date <= endDate.toISOString());
          }
    }
    props.submitFilter(filterd);
  }

  const theme = useTheme();
  const useStyles = makeStyles(listPageStyles(theme));
  const classes = useStyles();

  return (
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
                {props.userList.map((option: { username: string; name: string }) => (
                  <MenuItem key={option.username} value={option.username}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item={true} xs={12} style={{ padding: 20, paddingTop: 0, display: 'flex' }}>
                <Grid item={true} xs={4} style={{ paddingRight: 20}}>
                    <Select
                        options={DATE_FILTER_OPERATORS}
                        values={DATE_FILTER_OPERATORS.filter((filterObj) => filterObj.value === condition)}
                        onChange={(obj: any) => setCondition(obj.value)}
                    />
                </Grid>
                <Grid item={true} xs={4} style={{ paddingRight: 20}}>
                    <KeyboardDatePicker
                    value={startDate}
                    onChange={(date: any) => setStartDate(date)}
                    format="MM/dd/yyyy"
                    />
                </Grid>
                {condition === IN_BETWEEN_TYPE && <Grid item={true} xs={4} >
                    <KeyboardDatePicker
                    value={endDate}
                    onChange={(date: any) => setEndDate(date)}
                    format="MM/dd/yyyy"
                    />
                </Grid>}
            </Grid>
            <Grid item={true} xs={10} style={{ padding: 20, paddingTop: 0 }}>
              <ReactButton className={classes.submitButton} size="sm" onClick={submitHandler} disabled={!( condition === IN_BETWEEN_TYPE ? submittedBy && startDate && endDate : submittedBy && startDate ) }>
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