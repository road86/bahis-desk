import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Button, Col, Row } from 'reactstrap';
import { Store } from 'redux';
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
import ModuleMenuItem from './Module';

/** register the clients reducer */
reducerRegistry.register(menuReducerName, menuReducer);

export interface MenuProps {
  setMenuItemActionCreator: any;
  setPrevMenuActionCreator: any;
  currentMenu: MenuItem | null;
  isBackPossible: boolean;
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
    const { currentMenu, isBackPossible } = this.props;
    return (
      <div className="menu-container">
        {isBackPossible && <Button onClick={this.onBackHandler}>Back</Button>}
        <Row>
          {currentMenu &&
            currentMenu.type === MODULE_TYPE &&
            currentMenu.children.map((menuItem, index) => (
              <Col key={'menu-' + index} md={4}>
                {this.typeEvalutor(menuItem)}
              </Col>
            ))}
        </Row>
      </div>
    );
  }
  private typeEvalutor = (menuItem: MenuItem) => {
    if (menuItem.type === MODULE_TYPE) {
      return <ModuleMenuItem menuItem={menuItem} />;
    }
    if (menuItem.type === FORM_TYPE) {
      return <FormMenuItem menuItem={menuItem} />;
    }
    if (menuItem.type === LIST_TYPE) {
      return <ListMenuItem menuItem={menuItem} />;
    }
    return null;
  };
  // tslint:disable-next-line: variable-name
  private onBackHandler = (_event: React.MouseEvent<Button>) => {
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
