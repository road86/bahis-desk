import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getNativeLanguageText } from '../../../helpers/utils';
import { IFrameMenu } from '../../../store/ducks/menu';
import { makeStyles, Typography, useTheme } from '@material-ui/core';
import { menuStyle } from '../style';
import { Link } from 'react-router-dom';
import { logger } from '../../../helpers/logger';

export interface IFrameMenuItemProps {
    menuItem: IFrameMenu;
    appLanguage: string;
}

function IFrameMenuItem(props: IFrameMenuItemProps) {
    const theme = useTheme();
    const useStyles = makeStyles(menuStyle(theme));
    const classes = useStyles();

    logger.info(`loading IFrameMenuItem for menuItem: ${JSON.stringify(props.menuItem)}`);

    return (
        <Link className={classes.outerCircle} to={`/iframe?url=${props.menuItem.external_url}`}>
            <div className={classes.innerDiv}>
                <div className={classes.circle}>
                    <div className={classes.image}>
                        <FontAwesomeIcon icon={['far', 'folder']} size="4x" />
                    </div>
                </div>
                <Typography variant="h6" color={'primary'}>
                    {getNativeLanguageText(props.menuItem.label, props.appLanguage).toUpperCase()}
                </Typography>
            </div>
        </Link>
    );
}

export default IFrameMenuItem;
