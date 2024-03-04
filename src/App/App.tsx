import * as React from 'react';
import { useEffect, Suspense } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, RouteComponentProps, Switch, withRouter } from 'react-router';
import { Store } from 'redux';

import { library } from '@fortawesome/fontawesome-svg-core'; // FIXME do we need fortawesome _AND_ material UI packages?
import { faFileAlt, faFolder, faListAlt, faUser } from '@fortawesome/free-regular-svg-icons'; // FIXME do we need fortawesome _AND_ material UI packages?
import {
    faArrowLeft,
    faBars,
    faChevronLeft,
    faLongArrowAltDown,
    faLongArrowAltUp,
    faPenNib,
    faPlus,
    faSort,
    faSync,
    faTools,
} from '@fortawesome/free-solid-svg-icons'; // FIXME do we need fortawesome _AND_ material UI packages?
import { IconButton, Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import CloseIcon from '@material-ui/icons/Close';

import AppRegister from '../components/AppRegister';
import { Form } from '../components/Form';
import FormDetails from '../components/FormDetails';
import List from '../components/List';
import ListProfile from '../components/ListProfile';
import SubmittedForm from '../components/SubmittedForm';
import ErrorBoundary from '../components/page/ErrorBoundary';
import Header from '../components/page/Header';

import IFrame from '../containers/IFrame';
import Menu from '../containers/Menu';

import { ipcRenderer } from '../services/ipcRenderer';

import { log } from '../helpers/log';

import { FORM_TYPE, MODULE_TYPE, MenuItem, getCurrentMenu } from '../store/ducks/menu';

import './App.css';
import { appStyles } from './styles';
import { Container, Grid } from '@material-ui/core';

library.add(
    faUser,
    faFolder,
    faListAlt,
    faFileAlt,
    faArrowLeft,
    faSync,
    faSort,
    faLongArrowAltDown,
    faLongArrowAltUp,
    faPlus,
    faTools,
    faBars,
    faPenNib,
    faChevronLeft,
);

export interface MenuProps {
    currentMenu: MenuItem | null;
}

/** Main App component */
const App: React.FC<RouteComponentProps & MenuProps> = (props: RouteComponentProps & MenuProps) => {
    const classes = appStyles();
    const { location } = props;
    const headerExcludedURLs = ['/', '/signup/'];
    const [lastSync, setLastSync] = React.useState<string | null>(null);
    const [unsyncCount, setUnsyncCount] = React.useState<number>(0);
    const [upazila, setUpazila] = React.useState<string>('');

    const [toastVisible, setToastVisible] = React.useState<boolean>(false);
    const [toastContent, setToastContent] = React.useState<any>({});

    const setLastSyncTime = async (override: string | undefined) => {
        log.info(' setLastSyncTime (client) ');
        let time = new Date().toLocaleString();
        if (override) {
            time = override;
        }
        setLastSync(time);
        log.info(` setLastSyncTime SUCCESS: ${time} (client) `);
    };

    const updateUnsyncCount = async () => {
        log.info('update Unsync Count');
        const response = await ipcRenderer.sendSync('fetch-query-data', 'select count(*) as cnt from data where status != 1');
        setUnsyncCount(response[0].cnt);
    };

    const logout = () => {
        props.history.push('/signup/');
    };

    const gotoMenu = () => {
        props.history.push('/menu/');
    };

    const gotoSubmittedData = () => {
        if (props.currentMenu) {
            const xform_id =
                props.currentMenu.type === MODULE_TYPE &&
                props.currentMenu.children[0].type === FORM_TYPE &&
                props.currentMenu.children[0].xform_id;

            if (xform_id) {
                props.history.push(`/formlist/${xform_id}`);
            } else {
                gotoMenu();
            }
        }
    };

    const toast = (response: any) => (
        <Snackbar open={toastVisible} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} key={'topleft'}>
            <>
                <Alert severity={response.severity}>
                    {response.msg}
                    <IconButton aria-label="close" color="secondary" onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Alert>
            </>
        </Snackbar>
    );

    const handleClose = () => {
        setToastVisible(false);
    };

    useEffect(() => {
        ipcRenderer.on('init-refresh-database', async () => {
            const response = await ipcRenderer.sendSync(
                'fetch-query-data',
                'select count(*) as cnt from data where status != 1',
            );
            const unSyncData = response[0].cnt;

            if (unSyncData > 0) {
                setToastVisible(true);
                setToastContent({
                    severity: 'error',
                    msg: `${unSyncData} data unsynced! Please Sync first`,
                });

                setTimeout(() => {
                    setToastVisible(false);
                }, 5000);
            } else {
                setToastVisible(true);
                setToastContent({
                    severity: 'success',
                    msg: `Database will refresh shortly. Please login again and sync first. 
                It might take a while for the first sync. please be patient while syncing`,
                });

                ipcRenderer.send('refresh-database');
                logout();
            }

            return;
        });
    }, []);

    return (
        <>
            <Header
                unsyncCount={unsyncCount}
                updateUnsyncCount={updateUnsyncCount}
                showContent={!headerExcludedURLs.includes(location.pathname)}
                handleLogout={logout}
                redirectToSubmitted={gotoSubmittedData}
                redirectToMenu={gotoMenu}
                syncTime={lastSync}
                pathName={location.pathname}
                setLastSyncTime={setLastSyncTime}
            />
            {toast(toastContent)}
            <div className={classes.offset} />
            <Container id="main-page-container">
                <Grid item xs={12}>
                    <Redirect to="/" />
                    <Switch>
                        <Route exact path="/">
                            <AppRegister onLogin={setUpazila} />
                        </Route>
                        <Route path="/signup">
                            <Redirect to="/" />
                        </Route>
                        <Route path="/iframe">
                            <IFrame upazila={upazila} />
                        </Route>
                        <Route exact path="/menu/">
                            <Menu />
                        </Route>
                        <Route exact path="/form/:form_id">
                            <Suspense fallback={<div>Loading...</div>}>
                                <ErrorBoundary>
                                    <Form setUnsyncCount={updateUnsyncCount} />
                                </ErrorBoundary>
                            </Suspense>
                        </Route>
                        <Route exact path="/formlist/:id">
                            <SubmittedForm />
                        </Route>
                        <Route exact path="/submittedDetails/:form_id/:id">
                            <FormDetails />
                        </Route>
                        <Route exact path="/list/:id">
                            <List />
                        </Route>
                        <Route exact path="/listProfile/:id">
                            <ListProfile />
                        </Route>
                        <Route render={() => <div>404 Route Not Found</div>} />
                    </Switch>
                </Grid>
            </Container>
        </>
    );
};

//XIM I presume all of the following is pointless
/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
    currentMenu: MenuItem | null;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
    const result = {
        currentMenu: getCurrentMenu(state),
    };
    return result;
};

/** map props to actions */
const mapDispatchToProps = {};

/** connect clientsList to the redux store */
const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);

export default withRouter(ConnectedApp);
