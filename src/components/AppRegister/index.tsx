import { Avatar, Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import AppTypeForm from './AppTypeForm';
import { registerStyles } from './styles';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://material-ui.com/">
        mPower Social Enterprise
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const steps = ['Select App', 'Select Region', 'User Sign In'];

function getStepContent(step: number) {
  switch (step) {
    case 0:
      return <AppTypeForm />;
    case 1:
      return <> Second Page </>;
    case 2:
      return <> Third Page </>;
    default:
      throw new Error('Unknown step');
  }
}

export default function AppRegister() {
  const classes = registerStyles();
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  return (
    <div className={classes.layout}>
      <Paper className={classes.paper} elevation={3}>
        <Grid container={true} direction="row" justify="center" alignItems="center">
          <Avatar variant="square" src="/icon.png" />
        </Grid>
        <Typography component="h1" variant="h4" align="center">
          App Register
        </Typography>
        <Stepper activeStep={activeStep} className={classes.stepper}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <React.Fragment>
          {activeStep === steps.length ? (
            <React.Fragment>
              <Typography variant="h5" gutterBottom={true}>
                Thank you for your order.
              </Typography>
              <Typography variant="subtitle1">
                Your order number is #2001539. We have emailed your order confirmation, and will
                send you an update when your order has shipped.
              </Typography>
            </React.Fragment>
          ) : (
            <React.Fragment>
              {getStepContent(activeStep)}
              <div className={classes.buttons}>
                {activeStep !== 0 && (
                  <Button onClick={handleBack} className={classes.button}>
                    Back
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  className={classes.button}
                >
                  {activeStep === steps.length - 1 ? 'Sign In' : 'Next'}
                </Button>
              </div>
            </React.Fragment>
          )}
        </React.Fragment>
      </Paper>
      <Copyright />
    </div>
  );
}
