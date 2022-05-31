import { library } from '@fortawesome/fontawesome-svg-core';

import { faFileAlt, faFolder, faListAlt, faUser } from '@fortawesome/free-regular-svg-icons';
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
} from '@fortawesome/free-solid-svg-icons';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import * as React from 'react';
import { Suspense } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
import { RouteComponentProps, withRouter } from 'react-router';
import BounceLoader from 'react-spinners/BounceLoader';
import { Col, Row, Container } from 'reactstrap';
import { Store } from 'redux';
import AppRegister from '../components/AppRegister';
// import Form from '../components/Form';
import FormDetails from '../components/FormDetails';
import List from '../components/List';
import ListProfile from '../components/ListProfile';
import Loading from '../components/Loading';
import ErrorBoundary from '../components/page/ErrorBoundary';
import Header from '../components/page/Header';
import SubmittedForm from '../components/SubmittedForm';
import Menu from '../containers/Menu';
import { ipcRenderer } from '../services/ipcRenderer';
import { getCurrentMenu, MenuItem, MODULE_TYPE, FORM_TYPE } from '../store/ducks/menu';
import './App.css';
import { GEOLOC_ENDPOINT } from '../configs/env';
import { appStyles } from './styles';
const Form = React.lazy(() => import('../components/Form'));

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
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isOverlayPresent, setSyncOverlay] = React.useState<boolean>(false);
  const headerExcludedURLs = ['/', '/signup/'];
  const [percentage, setPercentage] = React.useState<number>(0);
  const [csv, setCsv] = React.useState<any>({});
  const [lastSync, setLastSync] = React.useState<string>('never');
  const [unsyncCount, setUnsyncCount] = React.useState<any>(0);

  const writeCsvToObj = (zip: any, csvFiles: any, i: number, tmpCsv: any) => {
    zip
      .file(csvFiles[i])
      .async('text')
      .then(function success(txt: any) {
        // console.log(txt);
        const arr = txt.split('\n');
        const jsonObj = [];
        const headers = arr[0].split(',');
        for (let n = 1; n < arr.length - 1; n++) {
          const data = arr[n].split(',');
          const obj: any = {};
          for (let j = 0; j < data.length; j++) {
            const key: any = headers[j].trim();
            obj[key] = data[j].trim();
          }
          jsonObj.push(obj);
        }

        tmpCsv[csvFiles[i]] = jsonObj;

        i++;
        if (i < csvFiles.length) {
          return writeCsvToObj(zip, csvFiles, i, tmpCsv);
        } else {
          if (tmpCsv !== {}) {
            setCsv({
              csv: tmpCsv,
            });
            ipcRenderer.send('write-geo-object', tmpCsv);
          }
        }
        return tmpCsv;
      });
  };

  //WHY THE HELL THIS IS IN FRONTEND? XIM
  const fetchGeoLocation = async () => {
    const JSZip = require('jszip');
    const JSZipUtils = require('jszip-utils');
    JSZipUtils.getBinaryContent(GEOLOC_ENDPOINT, (err: any, data: any) => {
      console.log(err);
      JSZip.loadAsync(data).then((zip: any) => {
        const csvFiles = Object.keys(zip.files);
        writeCsvToObj(zip, csvFiles, 0, {});
      });
    });
  };

  const autoUpdateCheck = async () => {
    await ipcRenderer.send('auto-update');
    ipcRenderer.on('checking_for_update', () => {
      console.log('ipcRenderer on checking_for_update');
      ipcRenderer.removeAllListeners('checking_for_update');
      // message.innerText = 'NO update is available';
      // notification.classList.remove('hidden');
    });

    ipcRenderer.on('update_not_available', () => {
      console.log('ipcRenderer on update_not_available');
      ipcRenderer.removeAllListeners('update_not_available');
      // message.innerText = 'NO update is available';
      setLoading(false);
      // notification.classList.remove('hidden');
    });

    ipcRenderer.on('update_available', () => {
      console.log('ipcRenderer on update_available');
      ipcRenderer.removeAllListeners('update_available');
    });

    ipcRenderer.on('update-downloading', () => {
      console.log('ipcRenderer on update_downloading');
      setLoading(true);
      ipcRenderer.removeAllListeners('update_downloading');
    });

    ipcRenderer.on('update_downloaded', () => {
      console.log('ipcRenderer on update_downloaded');
      ipcRenderer.removeAllListeners('update_downloaded');
      ipcRenderer.removeAllListeners('download_progress');
      setLoading(false);
    });

    ipcRenderer.on('download_progress', function (event: any, data: any) {
      console.log('ipcRenderer on download_progress', data, event);
      setPercentage(data);
    });
  };

  const fetchLastSyncTime = async () => {
    const syncTime: any = await ipcRenderer.sendSync('fetch-last-sync');
    //  setLastSync(syncTime);
    const time = syncTime.lastSync !== 0 ? new Date(Math.round(syncTime.lastSync)).toLocaleString() : 'never';
    setLastSync(time);
  }

  const updateUnsyncCount = async () => {
    const response = await ipcRenderer.sendSync('fetch-query-data', 'select count(*) as cnt from data where status != 1');
    setUnsyncCount(response[0].cnt);
  }

  //XIM
  //what is setTimeout for?!
  React.useEffect(() => {
    updateUnsyncCount();
      fetchLastSyncTime();
      if (navigator.onLine) {
        // fetchGeoLocation();
        autoUpdateCheck();
          fetchGeoLocation();
      }
  }, []);

  const logout = () => {
    props.history.push('/signup/');
  };

  const gotoMenu = () => {
    props.history.push('/menu/');
  }

  const gotoSubmittedData = () => {
    if (props.currentMenu) {
      const xform_id = props.currentMenu.type === MODULE_TYPE 
      && props.currentMenu.children[0].type === FORM_TYPE 
      && props.currentMenu.children[0].xform_id;

      if (xform_id) {
        props.history.push(`/formlist/${xform_id}`);
      } else {
        gotoMenu();
      }
    }
  }

  const setSync = (data: boolean) => {
    setSyncOverlay(data);
    fetchLastSyncTime();
  };

  return (
    <React.Fragment>
      <LoadingOverlay className="sync-overlay" active={isOverlayPresent} spinner={<BounceLoader />} text="Syncing">
        {/* {!headerExcludedURLs.includes(location.pathname) && ( */}
        <Header unsyncCount={unsyncCount} updateUnsyncCount={updateUnsyncCount} showContent={!headerExcludedURLs.includes(location.pathname)} handleLogout={logout} setSyncOverlayHandler={setSync} redirectToSubmitted={gotoSubmittedData} redirectToMenu={gotoMenu} syncTime={lastSync} pathName={location.pathname} />
        {/* )} */}
        <div className={classes.offset} />
        <Row id="main-page-container">
          <Col>
            <Redirect to="/" />
            <Switch>
              <Route exact={true} path="/">
                <Loading />
              </Route>
              <Route exact={true} path="/signup/">
                <AppRegister csv={csv} />
              </Route>
              <Route exact={true} path="/menu/">
                <Menu appLanguage={'English'} setSyncOverlayHandler={setSyncOverlay} />
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
      </LoadingOverlay>
      {loading ? (
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          display="inline-flex"
          justifyContent="space-between"
        >
          <Typography
            variant="caption"
            component="div"
            style={{ marginLeft: 10, marginTop: 15 }}
            color="primary"
          >
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
              <Typography
                variant="caption"
                component="div"
                color="primary"
              >{`${percentage}%`}</Typography>
            </Box>
          </Box>
        </Box>
      ) : null}
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
