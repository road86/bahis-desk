import OdkFormRenderer from 'odkformrenderer';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { DEMO_FORM_JSON } from '../../constants';

/** interface for Form URL params */
interface FormURLParams {
  id: string;
}

class Form extends React.Component<RouteComponentProps<FormURLParams>> {
  public render() {
    const handleSubmit = (userInput: any) => {
      // tslint:disable-next-line: no-console
      console.log(JSON.stringify(userInput));
    };
    const props = {
      defaultLanguage: 'English',
      formDefinitionJson: DEMO_FORM_JSON,
      handleSubmit,
      userInputJson: {},
    };
    return (
      <div>
        <Link to="/">
          <h1>Back</h1>
        </Link>
        <OdkFormRenderer {...props} />
      </div>
    );
  }
}

export default withRouter(Form);
