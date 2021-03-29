import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import reducerRegistry from '@onaio/redux-reducer-registry';
import { delay } from 'q';
import * as React from 'react';
import { Button, Container } from 'react-floating-action-button';
import Loader from 'react-loader-spinner';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
import Typist from 'react-typist';
import { Alert, Col, Row } from 'reactstrap';
import { Store } from 'redux';
import { appSync, dataSync, getNativeLanguageText } from '../../helpers/utils';
import { ipcRenderer } from '../../services/ipcRenderer';
import menuReducer, {
  FORM_TYPE,
  getCurrentMenu,
  isPrevMenuEmpty,
  LIST_TYPE,
  MenuItem,
  MODULE_TYPE,
  reducerName as menuReducerName,
  setMenuItem,
  setPrevMenu,
} from '../../store/ducks/menu';
import FormMenuItem from './Form';
import ListMenuItem from './List';
import './Menu.css';
import ModuleMenuItem from './Module';

/** register the clients reducer */
reducerRegistry.register(menuReducerName, menuReducer);

export interface MenuProps {
  setMenuItemActionCreator: any;
  setPrevMenuActionCreator: any;
  currentMenu: MenuItem | null;
  isBackPossible: boolean;
  appLanguage: string;
  setSyncOverlayHandler: any;
}

export interface MenuState {
  shouldAlertOpen: boolean;
  isLoadComplete: boolean;
  isDataAvailable: boolean;
  username: string;
}

interface MenuURLParams {
  username: string;
}

class Menu extends React.Component<
  RouteComponentProps<{}, {}, MenuURLParams> & MenuProps,
  MenuState
> {
  constructor(props: RouteComponentProps<{}, {}, MenuURLParams> & MenuProps) {
    super(props);
    this.state = {
      shouldAlertOpen: false,
      isLoadComplete: false,
      isDataAvailable: false,
      username: '',
    };
  }

  public async componentDidMount() {
    const user: any = await ipcRenderer.sendSync('fetch-username');
    this.setState({username: user.username});
    await setTimeout(async () => {
      const fix = this;
      const { currentMenu, setMenuItemActionCreator } = fix.props;
      if (!currentMenu) {
        const newMenuItem = await ipcRenderer.sendSync('fetch-app-definition');
        // console.log(newMenuItem);
        setMenuItemActionCreator(JSON.parse(newMenuItem));
      }
      fix.setState({ shouldAlertOpen: false });
      this.setState({ isLoadComplete: true });
    }, 2000);
    // console.log(response);
  }

  public render() {
    const { currentMenu, isBackPossible, appLanguage } = this.props;
    const { shouldAlertOpen, isLoadComplete, isDataAvailable, username } = this.state;
    return (
      <React.Fragment>
        {isLoadComplete ? (
          <div className="menu-container">
            {isDataAvailable && <Alert color="success">Couldn't Fetch Latest Data!</Alert>}
            {shouldAlertOpen && <Alert color="success">Everything is up-to-date!</Alert>}
            <Row id="menu-title-container">
              <Col>
                {isBackPossible && (
                  <div onClick={this.onBackHandler}>
                    <h6 className="menu-back">
                      <span className="bg-menu-back">
                        <FontAwesomeIcon icon={['fas', 'arrow-left']} /> <span> Back </span>
                      </span>
                    </h6>
                  </div>
                )}
                <h3 className="menu-title lead">
                  {currentMenu ? getNativeLanguageText(currentMenu.label, appLanguage) : ''}
                </h3>
              </Col>
            </Row>
            <Row id="menu-body">
              {currentMenu &&
                currentMenu.type === MODULE_TYPE &&
                currentMenu.children.map((menuItem, index) => (
                  <Col key={'menu-' + index} className="menu-item" md={4}>
                    {this.typeEvalutor(menuItem, appLanguage)}
                  </Col>
                ))}
            </Row>
            <Container>
              <Button
                tooltip="Sync App with Server"
                className="floating-item"
                onClick={this.onAppSyncHandler}
              >
                <FontAwesomeIcon icon={['fas', 'tools']} />
              </Button>
              <Button
                tooltip="Fetch Latest Update"
                className="floating-item"
                onClick={this.appUpdateHandler}
              >
                <FontAwesomeIcon icon={['fas', 'pen-nib']} />
              </Button>
              <Button
                tooltip="Sync Data with Server"
                className="floating-item"
                onClick={this.onSyncHandler}
              >
                <FontAwesomeIcon icon={['fas', 'sync']} />
              </Button>
              <Button tooltip="Menu" className="floating-btn">
                <FontAwesomeIcon icon={['fas', 'bars']} />
              </Button>
            </Container>
          </div>
        ) : (
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
        )}
      </React.Fragment>
    );
  }
  private typeEvalutor = (menuItem: MenuItem, appLanguage: string) => {
    if (menuItem.type === MODULE_TYPE) {
      return <ModuleMenuItem menuItem={menuItem} appLanguage={appLanguage} />;
    }
    if (menuItem.type === FORM_TYPE) {
      return <FormMenuItem menuItem={menuItem} appLanguage={appLanguage} />;
    }
    if (menuItem.type === LIST_TYPE) {
      return <ListMenuItem menuItem={menuItem} appLanguage={appLanguage} />;
    }
    return null;
  };
  // tslint:disable-next-line: variable-name
  private onBackHandler = (_event: React.MouseEvent<HTMLElement>) => {
    this.props.setPrevMenuActionCreator();
  };

  // tslint:disable-next-line: variable-name
  private onSyncHandler = async (_event: React.MouseEvent<HTMLButtonElement>) => {
    // console.log(userName);
    this.props.setSyncOverlayHandler(true);
    await delay(500);
    await dataSync();
    this.props.setSyncOverlayHandler(false);
    await delay(200);
    this.setState({ shouldAlertOpen: true });
    await delay(1000);
    this.setState({ shouldAlertOpen: false });
  };

  // tslint:disable-next-line: variable-name
  private onAppSyncHandler = async (_event: React.MouseEvent<HTMLButtonElement>) => {
    // console.log(userName);
    this.props.setSyncOverlayHandler(true);
    await delay(500);
    await appSync();
    this.props.setSyncOverlayHandler(false);
    await delay(200);
    this.setState({ shouldAlertOpen: true });
    await delay(1000);
    this.setState({ shouldAlertOpen: false });
  };

  // tslint:disable-next-line: variable-name
  private appUpdateHandler = (_event: React.MouseEvent<HTMLButtonElement>) => {
    // ipcRenderer.sendSync('request-app-restart');
    ipcRenderer.sendSync('auto-update');
  };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  currentMenu: MenuItem | null;
  isBackPossible: boolean;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const result = {
    currentMenu: getCurrentMenu(state),
    isBackPossible: !isPrevMenuEmpty(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  setMenuItemActionCreator: setMenuItem,
  setPrevMenuActionCreator: setPrevMenu,
};

/** connect clientsList to the redux store */
const ConnectedMenu = connect(mapStateToProps, mapDispatchToProps)(Menu);

export default withRouter(ConnectedMenu);
