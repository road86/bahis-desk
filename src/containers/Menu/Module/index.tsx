import * as React from 'react';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { ModuleMenu } from '../../../store/ducks/menu';

export interface ModuleMenuItemProps {
  menuItem: ModuleMenu;
}

class ModuleMenuItem extends React.Component<ModuleMenuItemProps> {
  public render() {
    const { menuItem } = this.props;
    return (
      <div>
        <Card>
          <CardBody>
            <CardTitle>{menuItem.name}</CardTitle>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default ModuleMenuItem;
