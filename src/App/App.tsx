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
import React, { Component } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import { Redirect, Route, Switch } from 'react-router';
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

/** interface for App state */
export interface AppState {
  shouldSyncOverlay: boolean;
}

/** Main App component */
class App extends Component<{}, AppState> {
  public state = { shouldSyncOverlay: false };
  public render() {
    return (
      <LoadingOverlay
        className="sync-overlay"
        active={this.state.shouldSyncOverlay}
        spinner={<BounceLoader />}
        text="Syncing"
      >
        <Header />
        <Container className="main-container">
          <Row id="main-page-container">
            <Col>
              {/* Production hack. Sets the router to home url on app startup */}
              <span>{window.location.pathname.includes('index.html') && <Redirect to="/" />}</span>
              <Switch>
                <Route exact={true} path="/">
                  <Loading />
                </Route>
                <Route exact={true} path="/menu/">
                  <Menu appLanguage={'English'} setSyncOverlayHandler={this.setSyncOverlay} />
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

  /** sets the sync overlay flag
   * @param {boolean} syncFlag - the syncFlag value to set
   */
  private setSyncOverlay = (syncFlag: boolean) => {
    this.setState({ ...this.state, shouldSyncOverlay: syncFlag });
  };
}

export default App;
