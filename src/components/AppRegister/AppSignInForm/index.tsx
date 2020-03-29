import { TextField } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { FORM_TITLE } from './constants';
import { appSignInFormStyles } from './styles';

// AppSignInForm component
export default function AppSignInForm() {
  const classes = appSignInFormStyles();
  return (
    <div className={classes.layout}>
      <Typography variant="h6" gutterBottom={true}>
        {FORM_TITLE}
      </Typography>
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={12}>
          <TextField required={true} id="username" label="Username" variant="outlined" />
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            required={true}
            id="password"
            type="password"
            label="Password"
            variant="outlined"
          />
        </Grid>
      </Grid>
    </div>
  );
}
