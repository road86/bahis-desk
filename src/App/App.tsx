import { library } from '@fortawesome/fontawesome-svg-core';
import { faFileAlt, faFolder, faListAlt, faUser } from '@fortawesome/free-regular-svg-icons';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { Col, Container, Navbar, NavbarBrand, Row } from 'reactstrap';
import Form from '../components/Form';
import List from '../components/List';
import Loading from '../components/Loading';
import Menu from '../containers/Menu';
import './App.css';

library.add(faUser, faFolder, faListAlt, faFileAlt, faArrowLeft);

/** Main App component */
class App extends Component {
  public render() {
    return (
      <div>
        <Navbar color="light" light={true} fixed={'top'} expand="md">
          <NavbarBrand> BAHIS </NavbarBrand>
        </Navbar>
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
                  <Menu appLanguage={'English'} />
                </Route>
                <Route exact={true} path="/form/:id">
                  <Form />
                </Route>
                <Route exact={true} path="/list/:id">
                  <List />
                </Route>
              </Switch>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
