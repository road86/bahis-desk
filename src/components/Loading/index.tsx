import * as React from 'react';
import { Redirect } from 'react-router';
// import Typist from 'react-typist';
import 'three-dots/dist/three-dots.css';
import './Loading.css';

/** interface for Loading State */
interface LoadingState {
    isLoadComplete: boolean;
}

// eslint-disable-next-line @typescript-eslint/ban-types
class Loading extends React.Component<{}, LoadingState> {
    constructor(props: any) {
        super(props);
        this.state = { isLoadComplete: false };
    }
    public async componentDidMount() {
        this.setState({ isLoadComplete: true });
    }

    public render() {
        return (
            <div className="menu-container">
                {this.state.isLoadComplete && <Redirect to="/signup/" />}
                <div className="loader-container">
                    <p>Loading...</p>
                    {/* <Loader
            type="Puff"
            color={theme.palette.primary.dark}
            height={100}
            width={100}
          />
          <Typist cursor={{ hideWhenDone: true }}>
            <span className="loader-title"> DLS BAHIS 2</span>
            <br />
            <span className="loader-subtitle">
              Welcome to BAHIS 2 
              <Typist.Backspace count={7} delay={500} />
              Loading {' '}
              <span className="blink-one">
                .
                <span className="blink-two">
                  .<span className="blink-three">.</span>
                </span>
              </span>
            </span>
          </Typist> */}
                </div>
            </div>
        );
    }
}

export default Loading;
