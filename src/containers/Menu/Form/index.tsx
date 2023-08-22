import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { getNativeLanguageText } from '../../../helpers/utils';
import { FormMenu } from '../../../store/ducks/menu';
import { makeStyles, Typography, useTheme } from '@material-ui/core';
import { menuStyle } from '../style';

export interface FormMenuItemProps {
    menuItem: FormMenu;
    appLanguage: string;
}

function FormMenuItem(props: FormMenuItemProps) {
    const { menuItem, appLanguage } = props;

    const theme = useTheme();
    const useStyles = makeStyles(menuStyle(theme));
    const classes = useStyles();

    return (
        <Link to={`/form/${menuItem.xform_id}/`}>
            <div className={classes.outerCircle}>
                <div className={classes.innerDiv}>
                    <div className={classes.circle}>
                        <div className={classes.image}>
                            <FontAwesomeIcon icon={['far', 'file-alt']} size="4x" />
                        </div>
                    </div>
                    <Typography variant="h6" color={'primary'}>
                        {getNativeLanguageText(props.menuItem.label, appLanguage).toUpperCase()}
                    </Typography>
                </div>
            </div>
        </Link>
    );
}

export default FormMenuItem;
