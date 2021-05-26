import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import reducerRegistry from '@onaio/redux-reducer-registry';
import { delay } from 'q';
import * as React from 'react';
import { Button, Container } from 'react-floating-action-button';
// import Loader from 'react-loader-spinner';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
// import Typist from 'react-typist';
import { Alert, Col, Row } from 'reactstrap';
import { Store } from 'redux';
import { appSync, dataSync } from '../../helpers/utils';
import { ipcRenderer } from '../../services/ipcRenderer';
import menuReducer, {
  FORM_TYPE,
  getCurrentMenu,
  isPrevMenuEmpty,
  LIST_TYPE,
  MenuItem,
  MODULE_TYPE,
  reducerName as menuReducerName,
  resetMenu,
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
  resetMenuActionCreator: any;
  currentMenu: MenuItem | null;
  isBackPossible: boolean;
  appLanguage: string;
  setSyncOverlayHandler: any;
}

// export interface MenuState {
//   shouldAlertOpen: boolean;
//   isDataAvailable: boolean;
//   username: string;
//   imageSrc: string;
// }

// interface MenuURLParams {
//   username: string;
// }
const Menu: React.FC<RouteComponentProps & MenuProps> = (props: RouteComponentProps & MenuProps) => {
// class Menu extends React.Component<RouteComponentProps<{}, {}, MenuURLParams> & MenuProps, MenuState> {
  // const [isDataAvailable, setDataAvailavle] = React.useState<boolean>(false);
  const [shouldAlertOpen, setAlertOpen] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>('');
  // const [appData, setAppData] = React.useState<any>({});

  const typeEvalutor = (menuItem: MenuItem, appLanguage: string) => {
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
  // // tslint:disable-next-line: variable-name
  // private onBackHandler = (_event: React.MouseEvent<HTMLElement>) => {
  //   this.props.setPrevMenuActionCreator();
  // };

  // tslint:disable-next-line: variable-name
  const onSyncHandler = async (_event: React.MouseEvent<HTMLButtonElement>) => {
    // console.log(userName);
    props.setSyncOverlayHandler(true);
    await delay(500);
    await dataSync();
    props.setSyncOverlayHandler(false);
    await delay(200);
    setAlertOpen(true);
    await delay(1000);
    setAlertOpen(false);
  };

  // tslint:disable-next-line: variable-name
  const onAppSyncHandler = async (_event: React.MouseEvent<HTMLButtonElement>) => {
    props.resetMenuActionCreator();
    // console.log(userName);
    props.setSyncOverlayHandler(true);
    await delay(500);
    await appSync();
    await delay(200);
    const newMenuItem = await ipcRenderer.sendSync('fetch-app-definition');
    // console.log(newMenuItem);
    props.setMenuItemActionCreator(JSON.parse(newMenuItem));
    await delay(300);
    props.setSyncOverlayHandler(false);
    await delay(200);
    setAlertOpen(true);
    await delay(1000);
    setAlertOpen(false);
  };

  const compUpdate = async () => {
    const user: any = await ipcRenderer.sendSync('fetch-username');
    // this.setState({ username: user.username });
    setUsername(user.username);
    console.log('check app call', username);
    const { currentMenu, setMenuItemActionCreator } = props;
    if (!currentMenu) {
      const newMenuItem = await ipcRenderer.sendSync('fetch-app-definition');
      // console.log(newMenuItem);
      setMenuItemActionCreator(JSON.parse(newMenuItem));
    }
    setAlertOpen(false);
    // console.log(response);
  };

  React.useEffect(() => {
    compUpdate();
  }, []);


    const { currentMenu, appLanguage } = props;
    return (
      <React.Fragment>
        <div className="menu-container">
          {/* {isDataAvailable && <Alert color="success">Couldn't Fetch Latest Data!</Alert>} */}
          {shouldAlertOpen && <Alert color="success">Everything is up-to-date!</Alert>}
          {/* <Row id="menu-title-container">
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
          </Row> */}
          <Row id="menu-body">
            {currentMenu &&
              currentMenu.type === MODULE_TYPE &&
              currentMenu.children.map((menuItem, index) => (
                <Col key={'menu-' + index} className="menu-item" lg={3} md={4} sm={6} xs={12}>
                  {typeEvalutor(menuItem, appLanguage)}
                </Col>
              ))}
          </Row>
          <Container>
            <Button tooltip="Sync App with Server" className="floating-item" onClick={onAppSyncHandler}>
              <FontAwesomeIcon icon={['fas', 'tools']} />
            </Button>
            {/*<Button*/}
            {/*  tooltip="Fetch Latest Update"*/}
            {/*  className="floating-item"*/}
            {/*  onClick={this.appUpdateHandler}*/}
            {/*>*/}
            {/*  <FontAwesomeIcon icon={['fas', 'pen-nib']} />*/}
            {/*</Button>*/}
            <Button tooltip="Sync Data with Server" className="floating-item" onClick={onSyncHandler}>
              <FontAwesomeIcon icon={['fas', 'sync']} />
            </Button>
            <Button tooltip="Menu" className="floating-btn">
              <FontAwesomeIcon icon={['fas', 'bars']} />
            </Button>
          </Container>
        </div>
      </React.Fragment>
    );

  // tslint:disable-next-line: variable-name
  // private appUpdateHandler = (_event: React.MouseEvent<HTMLButtonElement>) => {
  //   // ipcRenderer.sendSync('request-app-restart');
  //   ipcRenderer.sendSync('auto-update');
  // };
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
  resetMenuActionCreator: resetMenu,
};

/** connect clientsList to the redux store */
const ConnectedMenu = connect(mapStateToProps, mapDispatchToProps)(Menu);

export default withRouter(ConnectedMenu);
