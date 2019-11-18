import * as React from 'react';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { ListMenu } from '../../../store/ducks/menu';

export interface ListMenuItemProps {
  menuItem: ListMenu;
}

class ListMenuItem extends React.Component<ListMenuItemProps> {
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

export default ListMenuItem;
