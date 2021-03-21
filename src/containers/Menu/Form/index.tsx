import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { getNativeLanguageText } from '../../../helpers/utils';
import { FormMenu } from '../../../store/ducks/menu';

export interface FormMenuItemProps {
  menuItem: FormMenu;
  appLanguage: string;
}

class FormMenuItem extends React.Component<FormMenuItemProps> {
  public render() {
    const { menuItem, appLanguage } = this.props;
    return (
      <div>
        <Card>
          <Link to={`/form/${menuItem.xform_id}/`}>
            <div className="card-image">
              <FontAwesomeIcon icon={['far', 'file-alt']} size="4x" />
            </div>
            <CardBody>
              <CardTitle className="text-nowrap initialism">
                {getNativeLanguageText(menuItem.label, appLanguage)}
              </CardTitle>
            </CardBody>
          </Link>
        </Card>
      </div>
    );
  }
}

export default FormMenuItem;
