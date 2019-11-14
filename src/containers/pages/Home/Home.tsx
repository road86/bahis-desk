// this is the home page component
import * as React from 'react';
import { Col, Row } from 'reactstrap';
import './Home.css';
import Thing from 'odkformrenderer';
declare global {
  interface Window {
    require: any;
  }
}
const ipcRenderer = window.require('electron').ipcRenderer;

export interface HomeState{
  test: string;
}

class Home extends React.Component<{}, HomeState> {
  constructor(props: Readonly<{}>) {
    super(props);
    this.state = {test: ""};
  }
  public async componentDidMount() {
    let test = await ipcRenderer.sendSync('synchronous-message', 'ping');
    this.setState({ test });
    console.log('front-end', test);
  }
  public render() {
    return (
      <div className="text-center">
        <Row className="welcome-box">
          <Col>
            <h3>Welcome to OpenSRp {this.state.test}</h3>
          </Col>
        </Row>
        <Thing />
      </div>
    );
  }
}

export default Home;
