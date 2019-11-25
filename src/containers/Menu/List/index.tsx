import * as React from 'react';
import { Link } from 'react-router-dom';
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
          <Link to={`/list/${menuItem.list_id}/`}>
            <CardBody>
              <CardTitle>{menuItem.name}</CardTitle>
            </CardBody>
          </Link>
        </Card>
      </div>
    );
  }
}

export default ListMenuItem;
