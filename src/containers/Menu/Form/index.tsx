import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { FormMenu } from '../../../store/ducks/menu';

export interface FormMenuItemProps {
  menuItem: FormMenu;
  appLanguage: string;
}

class FormMenuItem extends React.Component<FormMenuItemProps> {
  public render() {
    const { menuItem } = this.props;
    return (
      <div>
        <Card>
          <Link to={`/form/${menuItem.xform_id}/`}>
            <div className="card-image">
              <FontAwesomeIcon icon={['far', 'file-alt']} size="4x" />
            </div>
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
