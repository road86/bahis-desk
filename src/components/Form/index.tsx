// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import OdkFormRenderer from 'odkformrenderer';

import 'odkformrenderer/example/index.css';
import queryString from 'query-string';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { ipcRenderer } from '../../services/ipcRenderer';
import './Form.css';
import { Alert } from 'reactstrap';
import { Typography } from '@material-ui/core';
import AlertDialog from './dialog';
// const OdkFormRenderer = React.lazy(() => import('odkformrenderer'));
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
/** interface for Form URL params */
interface FormURLParams {
  id: string;
}

interface formProps extends RouteComponentProps<FormURLParams> {
  appLanguage: string;
  setUnsyncCount: any;
}

interface FormState {
  formDefinition: any;
  formChoices: any;
  toastVisible: boolean;
  userLocationInfo: any;
  userInfo: any;
  showConfirmDialog: boolean;
  userInput: any;
}

const getSearchDBProperties = (question: any, path: any) => {

  const pickSearchDBVariable = (appearance: any) => {
    const arr = appearance.split(',').filter((data: any) => data.includes('searchDB'));
    return arr.length > 0 ? arr[0].trim() : null;
  }

  let properties: any = [];
  if (question && question.children !== undefined) {


    for (let i = 0; i < question.children.length; i++) {
      const ques = question.children[i];
      const questionPath = `${path}/${ques.name}`;

      if (ques.control !== undefined && ques.control.appearance !== undefined && ques.control.appearance.includes("searchDB")) {
        properties.push([questionPath, pickSearchDBVariable(ques.control.appearance)]);
      }
      if (ques.type === 'group' || ques.type === 'survey') {
        const result = getSearchDBProperties(ques, questionPath);
        properties = properties.concat(result);
      }
    }
  }
  console.log(properties);
  return properties;
}

class Form extends React.Component<formProps, FormState> {
  constructor(props: any) {
    super(props);
    this.state = { formDefinition: null, formChoices: null, toastVisible: false, userLocationInfo: null, userInfo: null, showConfirmDialog: false, userInput: null };
  }
  public async componentDidMount() {
    const { match } = this.props;
    const formId = match.params.id || '';
    const formDefinitionObj = await ipcRenderer.sendSync('fetch-form-definition', formId);
    const userLocationInfo = await ipcRenderer.sendSync('user-db-info');
    const userInfo = await ipcRenderer.sendSync('fetch-userlist');
    if (formDefinitionObj != null) {
      const { definition, formChoices } = formDefinitionObj;
      this.setState({ formDefinition: definition, formChoices, userLocationInfo, userInfo });
    }
  }

  public getUserInput = (dataJson: any) => {
    let userInput = dataJson && typeof dataJson === 'string' ? JSON.parse(atob(dataJson)) : {}

    console.log("calling getUserinput ");
    const userInputProperties = getSearchDBProperties(JSON.parse(this.state.formDefinition), '');
    if (userInputProperties.length > 0) {
      const { userLocationInfo } = this.state;
      for (let prop of userInputProperties) {
        userInput = {
          ...userInput,
          [prop[0].slice(1)]: userLocationInfo[prop[1].split('@')[1]]
        }
      }
    }
    console.log({ userInput });
    return userInput;
  }

  public render() {

    const handleYes = () => {


      const userInput = this.state.userInput;
      // tslint:disable-next-line: no-console
      if (userInput && userInput !== 'Field Violated' && userInput !== 'submitted') {
        const inputJson = dataJson && typeof dataJson === 'string' ? JSON.parse(atob(dataJson)) : null;
        const metaId = inputJson !== null && (inputJson['meta/instanceID'] !== null || inputJson['meta/instanceID'] != 'undefined' || inputJson['meta/instanceID'] != '') ? props.userInputJson['meta/instanceID'] : `${this.state.userInfo.users[0].username}-${this.generateUid()}`;
        const { match } = this.props;
        const formId = match.params.id || '';
        ipcRenderer.send('submit-form-response', {
          data: JSON.stringify({ ...userInput, 'meta/instanceID': metaId }),
          formId,
        });
        this.setState({
          toastVisible: true,
          showConfirmDialog: false
        });
        setTimeout(() => {
          this.props.history.push('/menu/');
          this.props.setUnsyncCount();
        }, 2010);
      }
    }

    const handleCancel = () => {
      const state = this.state;
      this.setState({ ...state, showConfirmDialog: false });
    }

    const handleSubmit = (userInput: any) => {
      const state = this.state;
      this.setState({ ...state, userInput, showConfirmDialog: true });
    };
    const { formDefinition, formChoices } = this.state;
    const { dataJson } = queryString.parse(this.props.location.search);
    const props = {
      csvList: formChoices ? JSON.parse(formChoices) : {},
      defaultLanguage: this.props.appLanguage,
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
      userInputJson: this.getUserInput(dataJson),
    };

    // const goBack = () => this.props.history.goBack();
    const getOdkFormRenderer = () => {

      console.log('-------> odk props: ', props);
      try {
        return (
          <OdkFormRenderer {...props} />
        );
      } catch (e) {
        return null;
      }
    };

    return (
      <div className="form-container">
        <AlertDialog open={this.state.showConfirmDialog} yes={handleYes} cancel={handleCancel} />
        {this.state.toastVisible && <Alert color="success">Form Submitted Successfylly!</Alert>}
        {/* <Link to="/menu/">
          <div>
            <h6 className="menu-back">
              <span className="bg-menu-back">
                <FontAwesomeIcon icon={['fas', 'arrow-left']} /> <span> Back </span>
              </span>
            </h6>
          </div>
        </Link> */}
        {formDefinition ? getOdkFormRenderer() : <div style={{ marginTop: '10%' }}>
          <Typography color="secondary" component="h1" variant="h4" align="center">
            Couldn't Found Form Definition
            </Typography>
        </div>}
      </div>
    );
  }
  // private s4 = () => {
  //   return Math.floor((1 + Math.random()) * 0x10000)
  //     .toString(16)
  //     .substring(1);
  // };

  //TODO do it properly
  //  Line 197:62:   Unexpected mix of '&' and '>>'  
  //     no-mixed-operators

  private generateUid = () => {
    // @ts-ignore: Unreachable code error
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}

export default withRouter(Form);
