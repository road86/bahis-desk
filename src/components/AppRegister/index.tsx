import { Avatar, Button, Grid, Paper, Snackbar, Typography, useTheme } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
// import Typist from 'react-typist';
// import Loader from 'react-loader-spinner';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { withRouter } from 'react-router';
import packageJson from '../../../package.json';
import { logger } from '../../helpers/logger';
import { ipcRenderer } from '../../services/ipcRenderer';
import AppSignInForm from './AppSignInForm';
import AlertDialog from './Dialog';
import { registerStyles } from './styles';

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            {`App Version ${packageJson.version}`}
        </Typography>
    );
}

// Props: include "onLogin: ('string')=>void"

function AppRegister(props: any) {
    const theme = useTheme();
    const useStyles = makeStyles(registerStyles(theme));
    const classes = useStyles();
    const [userInput, setUserInput] = React.useState({});
    const [toastVisible, setToastVisible] = React.useState<boolean>(false);
    const [toastContent, setToastContent] = React.useState<any>({});
    const [openAlert, setOpenAlert] = React.useState<any>(false);
    const [loginArgs, setLoginArgs] = React.useState<any>({});
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

    const performChangeUserOperation = async (ans: any) => {
        if (ans === 'delete') {
            await ipcRenderer.send('change-user', loginArgs);
        } else {
            setToastContent({ severity: 'Error', msg: 'Logged In Successfully without changing the user' });
            setSignInButtonDisabled(false);
        }
        setOpenAlert(false);
    };

    const handleSignIn = async () => {
        logger.info(` client-side handleSignIn `);
        setSignInButtonDisabled(true);
        await ipcRenderer.send('sign-in', userInput);
        ipcRenderer.on('deleteTableDialogue', function (event: any, args: any) {
            logger.debug('in delete table dialogue: ', event, args);
            setOpenAlert(true);
            setLoginArgs(args);
        });

        ipcRenderer.on('formSubmissionResults', function (event: any, args: any) {
            logger.debug('in formSubmissionResults: ', event, args);
            if (args !== undefined) {
                setToastVisible(true);
                if (args.username === '') {
                    if (args.message === '') {
                        setToastContent({
                            severity: 'error',
                            msg: 'Unknown failure, please try again. If this continues to happen please speak to support.',
                        });
                    } else {
                        setToastContent({ severity: 'error', msg: args.message });
                    }
                    setSignInButtonDisabled(false);
                } else {
                    switch (args.message) {
                        case 'signIn::local':
                            setToastContent({
                                severity: 'info',
                                msg: "Found an offline-ready account with those credentials. Logging you in.\nIf you are connected to the internet a data sync may occur automatically, which may take some time; if not, please use the 'Sync Now' button on the next screen.",
                            });
                            break;
                        case 'changeUser':
                            setToastContent({
                                severity: 'warning',
                                msg: 'You requested a change of user database.\n Please wait as the app synchronises user data for offline use.',
                            });
                            break;
                        case 'signIn::firstTimeUser':
                            setToastContent({
                                severity: 'warning',
                                msg: 'You are logging in for the first time.\n Please wait as the app synchronises user data for offline use.',
                            });
                            break;
                        case 'signIn::offlineUser':
                            setToastContent({
                                severity: 'info',
                                msg: "Found an offline-ready account with those credentials. Logging you in.\nIf you are connected to the internet a data sync may occur automatically, which may take some time; if not, please use the 'Sync Now' button on the next screen.",
                            });
                            break;
                        default:
                            setToastContent({
                                severity: 'error',
                                msg: `Possible unknown error while signing you in. Please close the app and try again.\n${args.message}`,
                            });
                            break;
                    }
                    //TODO first check that you are actually logged in you idiot
                    syncAppModule();
                }
            }
        });
    };

    //Disabling automatic sync to allow offline login and properly display last syn and number of unsynced records after login
    const syncAppModule = async () => {
        const user: any = await ipcRenderer.sendSync('fetch-username', 'syncAppModule');
        const isAppDef: any = await ipcRenderer.sendSync('fetch-query-data', 'SELECT * from app');

        if (isAppDef.length !== 0) {
            props.history.push({
                pathname: '/menu/',
                state: { username: user },
            });
        } else {
            //   const user: any = await ipcRenderer.sendSync('fetch-username');
            await ipcRenderer.send('start-app-sync', user.username);

            ipcRenderer.on('formSyncComplete', async function (event: any, args: any) {
                logger.info('Finished first sync');
                logger.debug('with: ', event, args);
                props.history.push({
                    pathname: '/menu/',
                    state: { username: user },
                });
            });
        }
    };

    const snackbarClose = () => {
        setToastVisible(false);
    };

    const toast = (response: any) => (
        <Snackbar
            open={toastVisible}
            onClose={snackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            key={'topcenter'}
        >
            <Alert onClose={snackbarClose} severity={response.severity}>
                {response.msg}
            </Alert>
        </Snackbar>
    );

    const [isSignInButtonDisabled, setSignInButtonDisabled] = useState(false);

    return (
        <Grid container={true} spacing={3} direction="row" justifyContent="center" alignItems="center">
            <div className={classes.layout}>
                {/* {toastVisible && <Alert color="success">{toastContent.msg}</Alert>} */}
                <Paper className={classes.paper} elevation={3}>
                    {toast(toastContent)}
                    <Grid container={true} direction="row" justifyContent="center" alignItems="center">
                        <div className={classes.circle}>
                            <div className={classes.image}>
                                <Avatar variant="square" src="/icon.png" />
                            </div>
                        </div>
                    </Grid>
                    <Grid item={true} style={{ marginTop: 20 }}>
                        <Typography component="h1" variant="h4" align="center">
                            Please sign in
                        </Typography>
                    </Grid>
                    <React.Fragment>
                        <AppSignInForm
                            userInput={userInput}
                            setFieldValueHandler={setFieldValue}
                            handleSignin={handleSignIn}
                        />

                        <div className={classes.buttons}>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleSignIn}
                                className={classes.button}
                                disabled={isSignInButtonDisabled}
                            >
                                Sign In
                            </Button>
                        </div>
                    </React.Fragment>
                </Paper>
                <Copyright />
            </div>
            <AlertDialog open={openAlert} handleClick={(e: any) => performChangeUserOperation(e)} />
        </Grid>
    );
}

export default withRouter(AppRegister);
