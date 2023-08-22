import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { getNativeLanguageText } from '../../../helpers/utils';
import { ListMenu } from '../../../store/ducks/menu';
import { menuStyle } from '../style';
import { makeStyles, Typography, useTheme } from '@material-ui/core';

export interface ListMenuItemProps {
    menuItem: ListMenu;
    appLanguage: string;
}

function ListMenuItem(props: ListMenuItemProps) {
    const { menuItem, appLanguage } = props;

    const theme = useTheme();
    const useStyles = makeStyles(menuStyle(theme));
    const classes = useStyles();

    return (
        <Link to={`/list/${menuItem.list_id}/`}>
            <div className={classes.outerCircle}>
                <div className={classes.innerDiv}>
                    <div className={classes.circle}>
                        <div className={classes.image}>
                            <FontAwesomeIcon icon={['far', 'list-alt']} size="4x" />
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

export default ListMenuItem;
