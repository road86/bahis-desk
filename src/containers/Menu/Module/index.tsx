import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { connect } from 'react-redux';
// import { Card, CardBody, CardTitle } from 'reactstrap';
import { getNativeLanguageText } from '../../../helpers/utils';
import { ModuleMenu, setMenuItem } from '../../../store/ducks/menu';
import { ipcRenderer } from '../../../services/ipcRenderer';
import { makeStyles, Typography, useTheme } from '@material-ui/core';
import { menuStyle } from '../style';
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
  const theme = useTheme();
  const useStyles = makeStyles(menuStyle(theme));
  const classes = useStyles();

  const compUpdate = async () => {
    if (props.menuItem.img_id.toString().length > 5) {
      const image: any = await ipcRenderer.sendSync('fetch-image', props.menuItem.name);
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
    <div  className={classes.outerCircle} onClick={onClickHandler}>
      <div className={classes.innerDiv}>
        <div className={classes.circle}>
          <div className={classes.image}>
              {navigator.onLine && imageSrc.length ? (
                <img
                  src={
                    imageSrc
                      ? require(`../../../../${imageSrc}`)
                      : require('../../../assets/images/debuglogo.png')
                  }
                  className={classes.iconClass}
                  alt={props.menuItem.name}
                />
              ) : (
                <FontAwesomeIcon icon={['far', 'folder']} size="4x" />
              )}
            </div>
        </div>
        <Typography variant="h6" color={'primary'}>
          {getNativeLanguageText(props.menuItem.label, props.appLanguage).toUpperCase()}
        </Typography>
      </div>
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
