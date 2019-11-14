import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import ConnectedPrivateRoute from '@onaio/connected-private-route';
import { ConnectedLogout, ConnectedOauthCallback, OauthLogin } from '@onaio/gatekeeper';
import Thing from 'odkformrenderer';
import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { Button, Form, FormGroup, FormText, Input, Label } from 'reactstrap';
import { Col, Container, Row } from 'reactstrap';
import Loading from '../components/page/Loading';
import GroupTypeEvaluator from '../components/typeEvalutors/Group';
import { DISABLE_LOGIN_PROTECTION } from '../configs/env';
import { providers } from '../configs/settings';
import { DEMO_FORM_JSON } from '../constants';
import { LOGIN_URL, LOGOUT_URL } from '../constants';
import { CLIENT_URL } from '../constants';
import ConnectedClientList from '../containers/Clients/List';
import ConnectedHeader from '../containers/ConnectedHeader';
import Home from '../containers/pages/Home/Home';
import { oAuthUserInfoGetter } from '../helpers/utils';
import './App.css';

library.add(faUser);

/** Main App component */
class App extends Component {
  public render() {
    const props = {
      defaultLanguage: 'English',
      fieldElements: DEMO_FORM_JSON.children,
    };
    return (
      <Container>
        <FormGroup>
          <h1>
            <Label for="exampleLabel">BAHIS</Label>
          </h1>
        </FormGroup>
        <GroupTypeEvaluator {...props} />

        <Row id="main-page-row">
          <Col>
            <Thing />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
