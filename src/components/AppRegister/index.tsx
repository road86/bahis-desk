import { Avatar, Grid, Snackbar, useTheme } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Typist from 'react-typist';
import Loader from 'react-loader-spinner';
import React from 'react';
import { withRouter } from 'react-router';
import { Alert } from 'reactstrap';
import { ipcRenderer } from '../../services/ipcRenderer';
import AppSignInForm from './AppSignInForm';
import { registerStyles } from './styles';
import { makeStyles } from '@material-ui/core/styles';
import packageJson from '../../../package.json';
import AlertDialog from './Dialog';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {`App Version ${packageJson.version}`}{' Copyright © '}
      <Link color="inherit" href="https://www.mpower-social.com/">
        mPower Social Enterprise
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

function AppRegister(props: any) {
  // const { history } = props;
  const theme = useTheme();
  const useStyles = makeStyles(registerStyles(theme));
  const classes = useStyles();
  // const classes = registerStyles(theme);
  // const [activeStep, setActiveStep] = React.useState(0);
  const [userInput, setUserInput] = React.useState({});
  const [toastVisible, setToastVisible] = React.useState<boolean>(false);
  const [toastContent, setToastContent] = React.useState<any>({});
  const [isLoadComplete, setLoadComplete] = React.useState<boolean>(true);
  const [openAlert, setOpenAlert] = React.useState<any>(false);
  const [loginArgs, setLoginArgs] = React.useState<any>({});
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

  const performLoginOperation = async (ans: any) => {
    if(ans === 'delete') {
      await ipcRenderer.send('login-operation', loginArgs);
    } else {
      setToastContent({ severity: 'Error', msg: 'Logged In Successfully' });
      syncAppModule();
    }
    setOpenAlert(false);
  }

  const handleSignIn = async () => {
    await ipcRenderer.send('sign-in', userInput);
    ipcRenderer.on('deleteTableDialogue', function (event: any, args: any) {
      console.log('in delete table dialogue: ',event, args);
      setOpenAlert(true);
      setLoginArgs(args);
    });

    ipcRenderer.on('formSubmissionResults', function (event: any, args: any) {
      console.log('check', event);
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
                Sign In
              </Typography>
            </Grid>
            <React.Fragment>
              <AppSignInForm
                userInput={userInput}
                setFieldValueHandler={setFieldValue}
                handleSignin={handleSignIn}
              />

              {/* {getStepContent(activeStep, userInput, setFieldValueHandler, )} */}
              <div className={classes.buttons}>
                <Button variant="contained" color="secondary" onClick={handleSignIn} className={classes.button}>
                  Sign In
                </Button>
              </div>
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
          <AlertDialog open={openAlert} handleClick={(e: any)=> performLoginOperation(e)} />
    </Grid>
  );
}

export default withRouter(AppRegister);


