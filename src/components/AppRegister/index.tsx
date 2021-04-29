import { Avatar, Grid, Snackbar, useTheme } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import Typography from '@material-ui/core/Typography';
// import { cpuUsage } from 'process';
import Typist from 'react-typist';
import Loader from 'react-loader-spinner';
import React from 'react';
import { withRouter } from 'react-router';
import { Alert } from 'reactstrap';
import { ipcRenderer } from '../../services/ipcRenderer';
import AppMetaForm from './AppMetaForm';
import AppSignInForm from './AppSignInForm';
import AppTypeForm from './AppTypeForm';
import { registerStyles } from './styles';
import { makeStyles } from '@material-ui/core/styles';

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

interface stepperProps {
  step: number;
  userInput: any;
  setFieldValueHandler: any;
  submitted: boolean;
  handleSignin: any;
}

const StepContent: React.FC<stepperProps> = (props: stepperProps) => {
  const { step, userInput, setFieldValueHandler, submitted, handleSignin } = props;
  console.log(submitted);
  switch (step) {
    case 0:
      return <AppTypeForm userInput={userInput} setFieldValueHandler={setFieldValueHandler} submitted={submitted} />;
    case 1:
      return <AppMetaForm userInput={userInput} setFieldValueHandler={setFieldValueHandler} submitted={submitted} />;
    case 2:
      return (
        <AppSignInForm
          userInput={userInput}
          setFieldValueHandler={setFieldValueHandler}
          submitted={submitted}
          handleSignin={handleSignin}
        />
      );
    default:
      throw new Error('Unknown step');
  }
};

function AppRegister(props: any) {
  const { history } = props;
  const theme = useTheme();
  const useStyles = makeStyles(registerStyles(theme));
  const classes = useStyles();
  // const classes = registerStyles(theme);
  const [activeStep, setActiveStep] = React.useState(0);
  const [userInput, setUserInput] = React.useState({});
  const [toastVisible, setToastVisible] = React.useState<boolean>(false);
  const [toastContent, setToastContent] = React.useState<any>({});
  const [isLoadComplete, setLoadComplete] = React.useState<boolean>(true);
  // const [formTypeSubmitted, setFormTypeSubmitted] = React.useState([false, false,false]);
  const [userEntry, setUserEntry] = React.useState<{ [key: string]: any }>({
    app_type: '',
    division: '',
    district: '',
    upazila: '',
    username: '',
    password: '',
    formTypeSubmitted: [false, false, false],
  });

  const setFieldValue = (fieldName: string, fieldValue: any) => {
    setUserInput({ ...userInput, [fieldName]: fieldValue });
    setUserEntry({ ...userEntry, [fieldName]: fieldValue });
  };

  const handleNext = () => {
    const formTypeSubmitted = userEntry.formTypeSubmitted;
    formTypeSubmitted[activeStep] = true;
    setUserEntry({ ...userEntry, formTypeSubmitted });
    if (activeStep === 0 && userEntry.app_type !== '') {
      setActiveStep(activeStep + 1);
    } else if (
      activeStep === 1 &&
      userEntry.division !== '' &&
      userEntry.district !== '' &&
      userEntry.upazilla !== ''
    ) {
      setActiveStep(activeStep + 1);
    } else if (activeStep === 2 && userEntry.username !== '' && userEntry.password !== '') {
      handleSignIn();
    }
  };

  const handleSignIn = async () => {
    await ipcRenderer.send('sign-in', userInput);
    ipcRenderer.on('formSubmissionResults', function (event: any, args: any) {
      console.log('args', event, args);
      if (args !== undefined) {
        setToastVisible(true);
        if (args.message !== '' && args.username === '') {
          setToastContent({ severity: 'Error', msg: 'Un authenticated User' });
        } else {
          setToastContent({ severity: 'Error', msg: 'Logged In Successfully' });
          syncAppModule();
        }
      }
    });
  };

  const syncAppModule = async () => {
    const user: any = await ipcRenderer.sendSync('fetch-username');
    setLoadComplete(false);
    await ipcRenderer.send('start-app-sync', user.username);
    ipcRenderer.on('formSyncComplete', async function (event: any, args: any) {
      console.log('check', event, args);
      setLoadComplete(true);
      if (args === 'done') {
        props.history.push({
          pathname: '/menu/',
          state: { username: args.username },
        });
      } else {
        setToastContent({ severity: 'Error', msg: "Couldn't sync app" });
      }
    });
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const navigateToMenu = () => {
    history.push('/menu/');
  };

  const snackbarClose = () => {
    setToastVisible(false);
    // props.history.push('/branch');
  };

  const toast = (response: any) => (
    <Snackbar
      open={toastVisible}
      autoHideDuration={3000}
      onClose={snackbarClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      key={'top' + 'center'}
    >
      <Alert severity={response.severity}>{response.msg}</Alert>
    </Snackbar>
  );

  return (
    <Grid container={true} spacing={3} direction="row" justify="center" alignItems="center">
      {isLoadComplete ? (
        <div className={classes.layout}>
          {/* {toastVisible && <Alert color="success">{toastContent.msg}</Alert>} */}
          <Paper className={classes.paper} elevation={3}>
            {toast(toastContent)}
            <Grid container={true} direction="row" justify="center" alignItems="center">
              <div className={classes.circle}>
                <div className={classes.image}>
                  <Avatar variant="square" src="/icon.png" />
                </div>
              </div>
            </Grid>
            <Grid item={true} style={{ marginTop: 20 }}>
              <Typography component="h1" variant="h4" align="center">
                App Register
              </Typography>
            </Grid>
            <Stepper activeStep={activeStep} className={classes.stepper}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel className={classes.stepper}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <React.Fragment>
              {activeStep === steps.length ? (
                <React.Fragment>
                  <Typography variant="h5" gutterBottom={true}>
                    App Registration Successful.
                  </Typography>
                  <Typography variant="subtitle1">
                    Please click the following button to go to{' '}
                    <Button color="primary" onClick={navigateToMenu}>
                      Menu
                    </Button>
                    .
                  </Typography>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <StepContent
                    step={activeStep}
                    userInput={userInput}
                    setFieldValueHandler={setFieldValue}
                    submitted={userEntry.formTypeSubmitted[activeStep]}
                    handleSignin={handleNext}
                  />
                  {/* {getStepContent(activeStep, userInput, setFieldValueHandler, )} */}
                  <div className={classes.buttons}>
                    {activeStep !== 0 && (
                      <Button onClick={handleBack} className={classes.button}>
                        Back
                      </Button>
                    )}
                    <Button variant="contained" color="secondary" onClick={handleNext} className={classes.button}>
                      {activeStep === steps.length - 1 ? 'Sign In' : 'Next'}
                    </Button>
                  </div>
                </React.Fragment>
              )}
            </React.Fragment>
          </Paper>
          <Copyright />
        </div>
      ) : (
        <div className="loader-container">
          <Loader
            type="Puff"
            color={theme.palette.primary.dark}
            height={100}
            width={100}
            timeout={3000} // 3 secs
          />
          <Typist cursor={{ hideWhenDone: true }}>
            <span className="loader-title"> BAHIS </span>
            <br />
            <span className="loader-subtitle">
              Welcome
              <Typist.Backspace count={7} delay={500} />
              Loading{' '}
              <span className="blink-one">
                .
                <span className="blink-two">
                  .<span className="blink-three">.</span>
                </span>
              </span>
            </span>
          </Typist>
        </div>
      )}
    </Grid>
  );
}

export default withRouter(AppRegister);
