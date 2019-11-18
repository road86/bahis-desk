import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';
import { Store } from 'redux';
import { ipcRenderer } from '../../services/ipcRenderer';
import menuReducer, {
  getCurrentMenu,
  MenuItem,
  MODULE_TYPE,
  reducerName as menuReducerName,
  setMenuItem,
} from '../../store/ducks/menu';

/** register the clients reducer */
reducerRegistry.register(menuReducerName, menuReducer);

export interface MenuProps {
  setMenuItemActionCreator: any;
  currentMenu: MenuItem | null;
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
    const { currentMenu } = this.props;
    return (
      <div className="text-center">
        <Row className="welcome-box">
          <Col>
            {currentMenu &&
              currentMenu.type === MODULE_TYPE &&
              currentMenu.children.map((menuItem, index) => <h3 key={index}>{menuItem.name}</h3>)}
            <h3>Welcome to OpenSRp </h3>
          </Col>
        </Row>
      </div>
    );
  }
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  currentMenu: MenuItem | null;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const result = {
    currentMenu: getCurrentMenu(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = { setMenuItemActionCreator: setMenuItem };

/** connect clientsList to the redux store */
const ConnectedMenu = connect(
  mapStateToProps,
  mapDispatchToProps
)(Menu);

export default ConnectedMenu;
