import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { connect } from 'react-redux';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { SERVER_URL } from '../../../App/constant';
import { getNativeLanguageText } from '../../../helpers/utils';
import { ModuleMenu, setMenuItem } from '../../../store/ducks/menu';

export interface ModuleMenuItemProps {
  menuItem: ModuleMenu;
  setMenuItemActionCreator: any;
  appLanguage: string;
}

class ModuleMenuItem extends React.Component<ModuleMenuItemProps> {
  public render() {
    const { menuItem, appLanguage } = this.props;
    console.log(menuItem);
    return (
      <div>
        <Card>
          <CardBody onClick={this.onClickHandler}>
            <div className="card-image">
              {navigator.onLine && menuItem.img_id ? <img width="30%" height="60px" color={'red'} src={SERVER_URL + '/'+ menuItem.img_id} alt="menu image" /> : <FontAwesomeIcon icon={['far', 'folder']} size="4x" />}
            </div>
            <CardTitle className="text-nowrap initialism">
              {getNativeLanguageText(menuItem.label, appLanguage)}
            </CardTitle>
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
const ConnectedModuleMenuItem = connect(null, mapDispatchToProps)(ModuleMenuItem);

export default ConnectedModuleMenuItem;
