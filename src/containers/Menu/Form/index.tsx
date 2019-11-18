import * as React from 'react';
import { Link } from 'react-router-dom';
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
          <Link to={`/form/${menuItem.form_id}/`}>
            <CardBody>
              <CardTitle>{menuItem.name}</CardTitle>
            </CardBody>
          </Link>
        </Card>
      </div>
    );
  }
}

export default FormMenuItem;
