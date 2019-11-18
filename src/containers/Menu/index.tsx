import * as React from 'react';
import { Col, Row } from 'reactstrap';
import { ipcRenderer } from '../../services/ipcRenderer';

export interface HomeState {
  test: string;
}

class Menu extends React.Component<{}, HomeState> {
  constructor(props: Readonly<{}>) {
    super(props);
    this.state = { test: '' };
  }
  public async componentDidMount() {
    const test = await ipcRenderer.sendSync('fetch-app-definition');
    this.setState({ test });
  }
  public render() {
    return (
      <div className="text-center">
        <Row className="welcome-box">
          <Col>
            <h3>Welcome to OpenSRp {this.state.test}</h3>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Menu;
