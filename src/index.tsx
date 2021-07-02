import { history } from '@onaio/connected-reducer-registry';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ConnectedRouter } from 'connected-react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'typeface-roboto';
import App from './App/App';
import './index.css';
import * as serviceWorker from './serviceWorker';
import store from './store';
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from './configs/theme';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <ThemeProvider theme={theme}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <App /> 
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('openSRP-root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
