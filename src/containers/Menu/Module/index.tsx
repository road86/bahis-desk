import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { connect } from 'react-redux';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { getNativeLanguageText } from '../../../helpers/utils';
import { ModuleMenu, setMenuItem } from '../../../store/ducks/menu';
import { ipcRenderer } from '../../../services/ipcRenderer';
// import {SERVER_URL} from "../../../App/constant";
// import containerImage from '../../../../src/assets/images/1617610473629_container.png_container.png';

export interface ModuleMenuItemProps {
  menuItem: ModuleMenu;
  setMenuItemActionCreator: any;
  appLanguage: string;
}
function ModuleMenuItem(props: ModuleMenuItemProps) {
  // class ModuleMenuItem extends React.Component<ModuleMenuItemProps> {
  const [imageSrc, setImageSource] = React.useState<string>('');

  const compUpdate = async () => {
    if (props.menuItem.img_id.toString().length > 5) {
      const image: any = await ipcRenderer.sendSync('fetch-image', props.menuItem.name);
      console.log('divisionList', image.replaceAll('\\', '/'));
      setImageSource(image.replaceAll('\\', '/'));
    }
  };

  React.useEffect(() => {
    compUpdate();
  }, []);

  // const imageUrl = '../../../../src/assets/images/' + '1617610487639_container.png_container.png';

  const onClickHandler = (_event: React.MouseEvent<HTMLDivElement>) => {
    const { menuItem } = props;
    props.setMenuItemActionCreator(menuItem);
  };

  // const getImage = () => {
  //   return <img src={require(`../../../../${imageSrc}`)} />;
  // };

  return (
    <div>
      <Card>
        <CardBody onClick={onClickHandler}>
          <div className="card-image">
            {navigator.onLine && imageSrc.length ? (
              <img
                src={
                  imageSrc
                    ? require(`../../../../${imageSrc}`)
                    : require('../../../../src/assets/images/logo.png')
                }
                width="30%" height="60px"
                alt={props.menuItem.name}
              />
            ) : (
              <FontAwesomeIcon icon={['far', 'folder']} size="4x" />
            )}
          </div>
          <CardTitle className="text-nowrap initialism">
            {getNativeLanguageText(props.menuItem.label, props.appLanguage)}
          </CardTitle>
        </CardBody>
      </Card>
    </div>
  );
  // tslint:disable-next-line: variable-name
}

/** connect the component to the store */

/** map props to actions */
const mapDispatchToProps = {
  setMenuItemActionCreator: setMenuItem,
};

/** connect clientsList to the redux store */
const ConnectedModuleMenuItem = connect(null, mapDispatchToProps)(ModuleMenuItem);

export default ConnectedModuleMenuItem;
