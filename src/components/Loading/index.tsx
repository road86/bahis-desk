import * as React from 'react';
import { Redirect } from 'react-router';
import Typist from 'react-typist';
import 'three-dots/dist/three-dots.css';
import { ipcRenderer } from '../../services/ipcRenderer';
import './Loading.css';

/** interface for Loading State */
interface LoadingState {
  isLoadComplete: boolean;
}

class Loading extends React.Component<{}, LoadingState> {
  constructor(props: any) {
    super(props);
    this.state = { isLoadComplete: false };
  }
  public async componentDidMount() {
    const response = await ipcRenderer.sendSync('start-app-sync');
    if (response) {
      await setTimeout(() => {
        this.setState({ isLoadComplete: true });
      }, 5000);
    }
  }

  public render() {
    return (
      <div className="menu-container">
        {this.state.isLoadComplete && <Redirect to="/menu/" />}
        <div className="loader-container">
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
