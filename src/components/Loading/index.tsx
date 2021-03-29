import * as React from 'react';
import Loader from 'react-loader-spinner';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import { Redirect } from 'react-router';
import Typist from 'react-typist';
import 'three-dots/dist/three-dots.css';
// import { ipcRenderer } from '../../services/ipcRenderer';
import './Loading.css';

/** interface for Loading State */
interface LoadingState {
  isLoadComplete: boolean;
}

class Loading extends React.Component<{}, LoadingState> {
  constructor(props: any) {
    super(props);
    this.state = { isLoadComplete: false };
    // const log = require("electron-log")
    // log.transports.file.level = "debug"
    // autoUpdater.logger = log
  }
  public async componentDidMount() {
    // const response = await ipcRenderer.sendSync('start-app-sync');
    // if (response) {
    //   await setTimeout(() => {
    //     this.setState({ isLoadComplete: true });
    //   }, 2000);
    // }
    setTimeout(() => {
      this.setState({ isLoadComplete: true });
    }, 2000);
  }

  public render() {
    return (
      <div className="menu-container">
        {this.state.isLoadComplete && <Redirect to="/signup/" />}
        <div className="loader-container">
          <Loader
            type="Puff"
            color="#00BFFF"
            height={100}
            width={100}
            timeout={3000} // 3 secs
          />
          <Typist cursor={{ hideWhenDone: true }}>
            <span className="loader-title"> BAHIS </span>
            <br />
            <span className="loader-subtitle">
              Welcome
              <Typist.Backspace count={7} delay={500} />
              Loading{' '}
              <span className="blink-one">
                .
                <span className="blink-two">
                  .<span className="blink-three">.</span>
                </span>
              </span>
            </span>
          </Typist>
        </div>
      </div>
    );
  }
}

export default Loading;
