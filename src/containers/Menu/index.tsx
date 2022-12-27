// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import reducerRegistry from '@onaio/redux-reducer-registry';
import _, { random } from 'lodash';
import * as React from 'react';
import {
  // Button, 
  Container
} from 'react-floating-action-button';
// import Loader from 'react-loader-spinner';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
// import Typist from 'react-typist';
import { Alert, Col, Row } from 'reactstrap';
import { Store } from 'redux';
import { ipcRenderer } from '../../services/ipcRenderer';
import menuReducer, {
  FORMLIST_TYPE,
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
import SubmittedFormMenuItem from './SubmittedForm';

/** register the clients reducer */
reducerRegistry.register(menuReducerName, menuReducer);

export interface MenuProps {
  setMenuItemActionCreator: any;
  setPrevMenuActionCreator: any;
  resetMenuActionCreator: any;
  currentMenu: MenuItem | null;
  isBackPossible: boolean;
  appLanguage: string;
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

const updateAppDefinition = (appDefinition: any) => {
  const update = function (module: any) {
    if (module.xform_id !== '') {
      const formModule = {
        xform_id: module.xform_id,
        name: module.name,
        img_id: module.img_id,
        children: [],
        label: {
          Bangla: 'New Submission',
          English: 'New Submission',
        },
        catchment_area: module.catchment_area,
        list_id: '',
        type: 'form',
        id: module.id,
      };
      const listId = random(100, 200);
      const listModule = {
        xform_id: module.xform_id,
        name: 'module_' + listId,
        img_id: '',
        children: [],
        label: {
          Bangla: 'Submitted Data',
          English: 'Submitted Data',
        },
        catchment_area: module.catchment_area,
        list_id: '',
        type: 'form_list',
        id: listId,
      };
      module.xform_id = '';
      module.name = 'module_' + listId;
      module.img_id = '';
      module.childre = {
        formModule,
        listModule,
      };
      //  module.children.push(formModule);
      //  module.children.push(listModule);
      module.type = 'container';
      module.id = listId;
    } else if (module.children)
      module.children.forEach((mod: any) => {
        update(mod);
      });
  };

  appDefinition.children.forEach((definition: any) => {
    update(definition);
  });
};

const compUpdate = async (currentMenu: MenuItem | null, setMenuItemActionCreator: any) => {
  if (!currentMenu) {
    console.log('No menu definition found, fetching');
    ipcRenderer
      .invoke('fetch-app-definition')
      .then((newMenuItem: any) => {
        if (newMenuItem) {
          console.log('setting menu item action creator to new menu item');
          setMenuItemActionCreator(JSON.parse(newMenuItem));
          console.log('updating app definition to new menu item');
          updateAppDefinition(JSON.parse(newMenuItem));
          console.log('fetching menu definition suceeded');
        }
        console.log('fetching menu definition suceeded but menu was empty');
      })
      .catch((err: Error) => {
        console.log('fetching menu definition failed');
        console.log(err);
      });
  }
};

const Menu: React.FC<RouteComponentProps & MenuProps> = (props: RouteComponentProps & MenuProps) => {
  // class Menu extends React.Component<RouteComponentProps<{}, {}, MenuURLParams> & MenuProps, MenuState> {
  // const [isDataAvailable, setDataAvailavle] = React.useState<boolean>(false);
  const [shouldAlertOpen, setAlertOpen] = React.useState<boolean>(false);
  // const [username, setUsername] = React.useState<string>('');
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
    if (menuItem.type === FORMLIST_TYPE) {
      return <SubmittedFormMenuItem menuItem={menuItem} appLanguage={appLanguage} />
    }
    return null;
  };

  React.useEffect(() => {
    const { currentMenu, setMenuItemActionCreator } = props;
    compUpdate(currentMenu, setMenuItemActionCreator);
    setAlertOpen(false);
  });

  const { currentMenu, appLanguage } = props;
  console.log(' ----> currentMenu: ', currentMenu);
  return (
    <React.Fragment>
      <div className="menu-container">
        {shouldAlertOpen && <Alert color="success">Everything is up-to-date!</Alert>}

        <Row id="menu-body">
          {currentMenu &&
            currentMenu.type === MODULE_TYPE &&
            _.sortBy(currentMenu.children, ['order']).map((menuItem, index) => (
              <Col key={'menu-' + index} className="menu-item" lg={3} md={4} sm={6} xs={12}>
                {typeEvalutor(menuItem, appLanguage)}
              </Col>
            ))}
        </Row>
        <Container>
          {/* <Button tooltip="Sync App with Server" className="floating-item" onClick={onAppSyncHandler}>
            <FontAwesomeIcon icon={['fas', 'tools']} />
          </Button>
          <Button tooltip="Sync Data with Server" className="floating-item" onClick={onSyncHandler}>
            <FontAwesomeIcon icon={['fas', 'sync']} />
          </Button> */}
          {/* <Button tooltip="Menu" className="floating-btn">
            <FontAwesomeIcon icon={['fas', 'bars']} />
          </Button> */}
        </Container>
      </div>
    </React.Fragment>
  );

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
