import { FormControl, FormHelperText, Radio, RadioGroup } from '@material-ui/core';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { APP_TYPE_FORM_NAME, APP_TYPE_OPTIONS, FORM_TITLE } from './constants';
import { appTypeFormStyles } from './styles';

// export App type option interface
export interface AppTypeOption {
  name: string;
  label: string;
}

// AppTypeForm props interface
interface AppTypeFormProps {
  userInput: { [key: string]: any };
  setFieldValueHandler: (fieldName: string, fieldValue: any) => void;
  submitted: boolean;
}

// AppTypeForm component
export default function AppTypeForm(props: AppTypeFormProps) {
  const classes = appTypeFormStyles();
  const { setFieldValueHandler, userInput, submitted } = props;
  const onChangeHandler = (event: any) => {
    setFieldValueHandler(event.target.name, event.target.value);
  };
  console.log('submitted', submitted, userInput[APP_TYPE_FORM_NAME])
  return (
    <div className={classes.layout}>
      <Typography variant="h6" gutterBottom={true}>
        {FORM_TITLE}
      </Typography>
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={12}>
          <FormControl component="fieldset" required={true} className={classes.layout}>
            <RadioGroup
              aria-label={APP_TYPE_FORM_NAME}
              name={APP_TYPE_FORM_NAME}
              onChange={onChangeHandler}
              value={userInput[APP_TYPE_FORM_NAME] || ''}
            >
              {APP_TYPE_OPTIONS.map((option: AppTypeOption) => (
                <FormControlLabel
                  key={option.name}
                  value={option.name}
                  control={<Radio color="primary" />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            <FormHelperText error={submitted && userInput[APP_TYPE_FORM_NAME] == undefined}>{submitted && userInput[APP_TYPE_FORM_NAME] == undefined ? 'Select an option' : '' }</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </div>
  );
}
