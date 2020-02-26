import { library } from '@fortawesome/fontawesome-svg-core';
import { faFileAlt, faFolder, faListAlt, faUser } from '@fortawesome/free-regular-svg-icons';
import {
  faArrowLeft,
  faBars,
  faLongArrowAltDown,
  faLongArrowAltUp,
  faPlus,
  faSort,
  faSync,
  faTools,
} from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import LoadingOverlay from 'react-loading-overlay';
import { Redirect, Route, Switch } from 'react-router';
import { RouteComponentProps, withRouter } from 'react-router';
import BounceLoader from 'react-spinners/BounceLoader';
import { Col, Container, Row } from 'reactstrap';
import Form from '../components/Form';
import List from '../components/List';
import Loading from '../components/Loading';
import Header from '../components/page/Header';
import Menu from '../containers/Menu';
import './App.css';

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
  faBars
);

/** Main App component */
function App(props: RouteComponentProps<{}>) {
  const { location } = props;
  const [isOverlayPresent, setSyncOverlay] = React.useState<boolean>(false);
  return (
    <LoadingOverlay
      className="sync-overlay"
      active={isOverlayPresent}
      spinner={<BounceLoader />}
      text="Syncing"
    >
      {location.pathname !== '/' && <Header />}
      <Container>
        <Row id="main-page-container">
          <Col>
            {/* Production hack. Sets the router to home url on app startup */}
            <span>{window.location.pathname.includes('index.html') && <Redirect to="/" />}</span>
            <Switch>
              <Route exact={true} path="/">
                <Loading />
              </Route>
              <Route exact={true} path="/menu/">
                <Menu appLanguage={'English'} setSyncOverlayHandler={setSyncOverlay} />
              </Route>
              <Route exact={true} path="/form/:id">
                <Form />
              </Route>
              <Route exact={true} path="/list/:id">
                <List appLanguage={'English'} />
              </Route>
            </Switch>
          </Col>
        </Row>
      </Container>
    </LoadingOverlay>
  );
}

export default withRouter(App);
