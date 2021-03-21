import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { getNativeLanguageText } from '../../../helpers/utils';
import { ListMenu } from '../../../store/ducks/menu';

export interface ListMenuItemProps {
  menuItem: ListMenu;
  appLanguage: string;
}

class ListMenuItem extends React.Component<ListMenuItemProps> {
  public render() {
    const { menuItem, appLanguage } = this.props;
    return (
      <div>
        <Card>
          <Link to={`/list/${menuItem.list_id}/`}>
            <div className="card-image">
              <FontAwesomeIcon icon={['far', 'list-alt']} size="4x" />
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

export default ListMenuItem;
