import OdkFormRenderer from 'odkformrenderer';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { ipcRenderer } from '../../services/ipcRenderer';

/** interface for Form URL params */
interface FormURLParams {
  id: string;
}

interface FormState {
  formDefinition: any;
}

class Form extends React.Component<RouteComponentProps<FormURLParams>, FormState> {
  constructor(props: any) {
    super(props);
    this.state = { formDefinition: null };
  }
  public async componentDidMount() {
    const { match } = this.props;
    const formId = match.params.id || '';
    const formDefinition = await ipcRenderer.sendSync('fetch-form-definition', formId);
    this.setState({ formDefinition });
  }
  public render() {
    const handleSubmit = (userInput: any) => {
      // tslint:disable-next-line: no-console
      if (userInput && userInput !== 'Field Violated' && userInput !== 'submitted') {
        const { match } = this.props;
        const formId = match.params.id || '';
        ipcRenderer.send('submit-form-response', { formId, data: JSON.stringify(userInput) });
        window.location.reload();
      }
    };
    const { formDefinition } = this.state;
    const props = {
      defaultLanguage: 'English',
      formDefinitionJson: formDefinition ? JSON.parse(formDefinition) : {},
      handleSubmit,
      userInputJson: {},
    };
    return (
      <div>
        <Link to="/">
          <h1>Back</h1>
        </Link>
        {formDefinition && <OdkFormRenderer {...props} />}
      </div>
    );
  }
}

export default withRouter(Form);
