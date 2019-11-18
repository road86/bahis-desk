import * as React from 'react';
import { connect } from 'react-redux';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { ModuleMenu, setMenuItem } from '../../../store/ducks/menu';

export interface ModuleMenuItemProps {
  menuItem: ModuleMenu;
  setMenuItemActionCreator: any;
}

class ModuleMenuItem extends React.Component<ModuleMenuItemProps> {
  public render() {
    const { menuItem } = this.props;
    return (
      <div>
        <Card>
          <CardBody onClick={this.onClickHandler}>
            <CardTitle>{menuItem.name}</CardTitle>
          </CardBody>
        </Card>
      </div>
    );
  }
  // tslint:disable-next-line: variable-name
  private onClickHandler = (_event: React.MouseEvent<HTMLDivElement>) => {
    const { menuItem } = this.props;
    this.props.setMenuItemActionCreator(menuItem);
  };
}

/** connect the component to the store */

/** map props to actions */
const mapDispatchToProps = {
  setMenuItemActionCreator: setMenuItem,
};

/** connect clientsList to the redux store */
const ConnectedModuleMenuItem = connect(
  null,
  mapDispatchToProps
)(ModuleMenuItem);

export default ConnectedModuleMenuItem;
