import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';
import { Store } from 'redux';
import { getNativeLanguageText } from '../../helpers/utils';
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
}

class Menu extends React.Component<MenuProps> {
  public async componentDidMount() {
    const { currentMenu, setMenuItemActionCreator } = this.props;
    if (!currentMenu) {
      const newMenuItem = await ipcRenderer.sendSync('fetch-app-definition');
      setMenuItemActionCreator(JSON.parse(newMenuItem));
    }
  }
  public render() {
    const { currentMenu, isBackPossible, appLanguage } = this.props;
    return (
      <div className="menu-container">
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
            <h3 className="menu-title">
              {currentMenu ? getNativeLanguageText(currentMenu.label, appLanguage) : ''}
            </h3>
          </Col>
        </Row>
        <Row id="menu-body">
          {currentMenu &&
            currentMenu.type === MODULE_TYPE &&
            currentMenu.children.map((menuItem, index) => (
              <Col key={'menu-' + index} md={4}>
                {this.typeEvalutor(menuItem, appLanguage)}
              </Col>
            ))}
        </Row>
      </div>
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
const ConnectedMenu = connect(
  mapStateToProps,
  mapDispatchToProps
)(Menu);

export default ConnectedMenu;
