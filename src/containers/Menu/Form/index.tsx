import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle } from 'reactstrap';
import { getNativeLanguageText } from '../../../helpers/utils';
import { FormMenu } from '../../../store/ducks/menu';
import { ipcRenderer } from '../../../services/ipcRenderer';

export interface FormMenuItemProps {
  menuItem: FormMenu;
  appLanguage: string;
}

// class FormMenuItem extends React.Component<FormMenuItemProps> {
function FormMenuItem(props: FormMenuItemProps) {
  // class ListMenuItem extends React.Component<ListMenuItemProps> {
  const [imageSource, setImageSource] = React.useState<string>('');

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
  const { menuItem, appLanguage } = props;
  return (
    <div>
      <Card>
        <Link to={`/form/${menuItem.xform_id}/`}>
          <div className="card-image">
            {navigator.onLine && imageSource.length ? (
              <img
                src={
                  imageSource
                    ? require(`../../../../${imageSource}`)
                    : require('../../../../src/assets/images/logo.png')
                }
                width="30%"
                height="60px"
                alt={menuItem.name}
              />
            ) : (
              <FontAwesomeIcon icon={['far', 'file-alt']} size="4x" />
            )}
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

export default FormMenuItem;
