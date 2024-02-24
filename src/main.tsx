// import React from 'react';
import { ConnectedRouter } from 'connected-react-router'; // FIXME doesn't work wiht React 18
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import DateFnsUtils from '@date-io/date-fns';
import { ThemeProvider } from '@material-ui/core/styles'; // FIXME doesn't work wiht React 18
import { MuiPickersUtilsProvider } from '@material-ui/pickers'; // FIXME doesn't work wiht React 18
import { history } from '@onaio/connected-reducer-registry'; // TODO can this be replaced?

import App from './App/App.tsx';
import { register } from './serviceWorker.ts';
import store from './store';
import { theme } from './theme.ts';

ReactDOM.render(
    //   <React.StrictMode> // we should move to StrictMode when we upgrade to react v18
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <ThemeProvider theme={theme}>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <App />
                </MuiPickersUtilsProvider>
            </ThemeProvider>
        </ConnectedRouter>
    </Provider>,
    //   </React.StrictMode>,
    document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
register();

postMessage({ payload: 'removeLoading' }, '*');
