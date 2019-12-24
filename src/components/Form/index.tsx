import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import OdkFormRenderer from 'odkformrenderer';
import 'odkformrenderer/example/index.css';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { ipcRenderer } from '../../services/ipcRenderer';
import './Form.css';

/** interface for Form URL params */
interface FormURLParams {
  id: string;
}

interface FormState {
  formDefinition: any;
  formChoices: any;
}

class Form extends React.Component<RouteComponentProps<FormURLParams>, FormState> {
  constructor(props: any) {
    super(props);
    this.state = { formDefinition: null, formChoices: null };
  }
  public async componentDidMount() {
    const { match } = this.props;
    const formId = match.params.id || '';
    const formDefinitionObj = await ipcRenderer.sendSync('fetch-form-definition', formId);
    const { definition, formChoices } = formDefinitionObj;
    this.setState({ formDefinition: definition, formChoices });
  }
  public render() {
    const handleSubmit = (userInput: any) => {
      // tslint:disable-next-line: no-console
      if (userInput && userInput !== 'Field Violated' && userInput !== 'submitted') {
        const { match } = this.props;
        const formId = match.params.id || '';
        ipcRenderer.send('submit-form-response', {
          data: JSON.stringify({ ...userInput, 'meta/instanceID': this.generateUid() }),
          formId,
        });
        this.props.history.push('/menu/');
      }
    };
    const { formDefinition, formChoices } = this.state;
    const props = {
      csvList: formChoices ? JSON.parse(formChoices) : {},
      defaultLanguage: 'English',
      formDefinitionJson: formDefinition ? JSON.parse(formDefinition) : {},
      handleSubmit,
      languageOptions: [
        {
          label: 'English',
          value: 'English',
        },
        {
          label: 'Bangla',
          value: 'Bangla',
        },
      ],
      userInputJson: {},
    };
    return (
      <div className="form-container">
        <Link to="/menu/">
          <h6 className="menu-back">
            <span className="bg-menu-back">
              <FontAwesomeIcon icon={['fas', 'arrow-left']} /> <span> Back </span>
            </span>
          </h6>
        </Link>
        {formDefinition && <OdkFormRenderer {...props} />}
      </div>
    );
  }
  private s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };

  private generateUid = () => {
    return (
      'uuid:' +
      this.s4() +
      this.s4() +
      '-' +
      this.s4() +
      '-' +
      this.s4() +
      '-' +
      this.s4() +
      '-' +
      this.s4() +
      this.s4() +
      this.s4()
    );
  };
}

export default withRouter(Form);
