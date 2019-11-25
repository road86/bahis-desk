import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { Col, Container, Row } from 'reactstrap';
import Form from '../components/Form';
import List from '../components/List';
import Menu from '../containers/Menu';
import './App.css';

library.add(faUser);

/** Main App component */
class App extends Component {
  public render() {
    return (
      <Container>
        <Row id="main-page-container">
          <Col>
            {/* Production hack. Sets the router to home url on app startup */}
            <span>{window.location.pathname.includes('index.html') && <Redirect to="/" />}</span>
            <Switch>
              <Route exact={true} path="/">
                <Menu />
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
    );
  }
}

export default App;
