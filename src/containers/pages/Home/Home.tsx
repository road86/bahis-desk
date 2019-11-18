// this is the home page component
import OdkFormRenderer from 'odkformrenderer';
import * as React from 'react';
import { Col, Row } from 'reactstrap';
import { DEMO_FORM_JSON, sampleUserInput } from '../../../constants';
import './Home.css';
declare global {
  interface Window {
    require: any;
  }
}
const ipcRenderer = window.require('electron').ipcRenderer;

export interface HomeState {
  test: string;
}

class Home extends React.Component<{}, HomeState> {
  constructor(props: Readonly<{}>) {
    super(props);
    this.state = { test: '' };
  }
  public async componentDidMount() {
    const test = await ipcRenderer.sendSync('fetch-app-definition', 'ping');
    this.setState({ test });
  }
  public render() {
    const handleSubmit = (userInput: any) => {
      // tslint:disable-next-line: no-console
      console.log(JSON.stringify(userInput));
    };
    const props = {
      defaultLanguage: 'English',
      formDefinitionJson: DEMO_FORM_JSON,
      handleSubmit,
      userInputJson: sampleUserInput,
    };
    return (
      <div className="text-center">
        <Row className="welcome-box">
          <Col>
            <h3>Welcome to OpenSRp {this.state.test}</h3>
          </Col>
        </Row>
        <OdkFormRenderer {...props} />
      </div>
    );
  }
}

export default Home;
