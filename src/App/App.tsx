import * as React from 'react';
import { Suspense } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, RouteComponentProps, Switch, withRouter } from 'react-router';
import { Col, Container, Row } from 'reactstrap'; // FIXME why are we using reactstrap _AND_ material UI?
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
// import { Box, CircularProgress, Typography } from '@material-ui/core';

import AppRegister from '../components/AppRegister';
import Form from '../components/Form';
import FormDetails from '../components/FormDetails';
import List from '../components/List';
import ListProfile from '../components/ListProfile';
// import Loading from "../components/Loading";
import SubmittedForm from '../components/SubmittedForm';
import ErrorBoundary from '../components/page/ErrorBoundary';
import Header from '../components/page/Header';

import Menu from '../containers/Menu';

import { ipcRenderer } from '../services/ipcRenderer';

import { logger } from '../helpers/logger';

import { FORM_TYPE, MODULE_TYPE, MenuItem, getCurrentMenu } from '../store/ducks/menu';

import './App.css';
import { appStyles } from './styles';

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
    // const [loading, setLoading] = React.useState<boolean>(false);
    const headerExcludedURLs = ['/', '/signup/'];
    // const [percentage, setPercentage] = React.useState<number>(0);
    // const [csv, setCsv] = React.useState<any>({});
    const [lastSync, setLastSync] = React.useState<string | null>(null);
    const [unsyncCount, setUnsyncCount] = React.useState<number>(0);

    const setLastSyncTime = async (override: string | undefined) => {
        logger.info(' setLastSyncTime (client) ');
        let time = new Date().toLocaleString();
        if (override) {
            time = override;
        }
        setLastSync(time);
        logger.info(` setLastSyncTime SUCCESS: ${time} (client) `);
    };

    const updateUnsyncCount = async () => {
        logger.info('update Unsync Count');
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

    return (
        <React.Fragment>
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
            {/* )} */}
            <div className={classes.offset} />
            <Row id="main-page-container">
                <Col>
                    <Redirect to="/" />
                    <Switch>
                        <Route exact={true} path="/">
                            <Redirect to="/signup/" />
                        </Route>
                        <Route exact={true} path="/signup/">
                            <AppRegister />
                        </Route>
                        <Route exact={true} path="/menu/">
                            <Menu />
                        </Route>
                        <Route exact={true} path="/form/:id">
                            <Container>
                                <Suspense fallback={<div>Loading...</div>}>
                                    <ErrorBoundary>
                                        <Form appLanguage={'English'} setUnsyncCount={updateUnsyncCount} />
                                    </ErrorBoundary>
                                </Suspense>
                            </Container>
                        </Route>
                        <Route exact={true} path="/formlist/:id">
                            <Container>
                                <SubmittedForm appLanguage={'English'} />
                            </Container>
                        </Route>
                        <Route exact={true} path="/submittedDetails/:id">
                            <Container>
                                <FormDetails />
                            </Container>
                        </Route>
                        <Route exact={true} path="/list/:id">
                            <Container>
                                <List appLanguage={'English'} />
                            </Container>
                        </Route>
                        <Route exact={true} path="/listProfile/:id">
                            <Container>
                                <ListProfile />
                            </Container>
                        </Route>
                    </Switch>
                </Col>
            </Row>
            {/* {loading ? (
                <Box position="fixed" bottom={0} left={0} right={0} display="inline-flex" justifyContent="space-between">
                    <Typography variant="caption" component="div" style={{ marginLeft: 10, marginTop: 15 }} color="primary">
                        Downloading
                    </Typography>
                    <Box position="relative" display="inline-flex" marginRight={2} marginBottom={2}>
                        <CircularProgress variant="determinate" value={percentage} />
                        <Box
                            top={0}
                            left={0}
                            bottom={0}
                            right={0}
                            position="absolute"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Typography variant="caption" component="div" color="primary">{`${percentage}%`}</Typography>
                        </Box>
                    </Box>
                </Box>
            ) : null} */}
        </React.Fragment>
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
