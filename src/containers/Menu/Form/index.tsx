import * as React from 'react';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { FormMenu } from '../../../store/ducks/menu';

export interface FormMenuItemProps {
  menuItem: FormMenu;
}

class FormMenuItem extends React.Component<FormMenuItemProps> {
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

export default FormMenuItem;
