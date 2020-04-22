import { IconButton, MenuItem, TextField } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import SystemUpdateAltIcon from '@material-ui/icons/SystemUpdateAlt';
import React from 'react';
import { FORM_TITLE } from './constants';
import { appMetaFormStyles } from './styles';

// App type option interface
export interface AppTypeOption {
  name: string;
  label: string;
}

// AppMetaForm props interface
interface AppMetaFormProps {
  setFieldValueHandler: (fieldName: string, fieldValue: any) => void;
}

// AppTypeForm component
export default function AppMetaForm(props: AppMetaFormProps) {
  const classes = appMetaFormStyles();
  const { setFieldValueHandler } = props;
  const onChangeHandler = (event: any) => {
    setFieldValueHandler(event.target.name, event.target.value);
  };
  return (
    <div className={classes.layout}>
      <Typography variant="h6" gutterBottom={true}>
        {FORM_TITLE}
        <IconButton aria-label="update catchment">
          <SystemUpdateAltIcon />
        </IconButton>
      </Typography>
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={12}>
          <TextField
            select={true}
            required={true}
            id="division"
            name="division"
            label="Division"
            variant="outlined"
            onChange={onChangeHandler}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            <MenuItem value={10}>Ten</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </TextField>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            select={true}
            required={true}
            id="district"
            name="district"
            label="District"
            variant="outlined"
            onChange={onChangeHandler}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            <MenuItem value={10}>Ten</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </TextField>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            select={true}
            required={true}
            id="upazila"
            label="Upazila"
            name="upazila"
            variant="outlined"
            onChange={onChangeHandler}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            <MenuItem value={10}>Ten</MenuItem>
            <MenuItem value={20}>Twenty</MenuItem>
            <MenuItem value={30}>Thirty</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </div>
  );
}
