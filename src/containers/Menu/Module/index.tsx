import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { connect } from 'react-redux';
import { getNativeLanguageText } from '../../../helpers/utils.tsx';
import { ModuleMenu, setMenuItem } from '../../../store/ducks/menu';
import { makeStyles, Typography, useTheme } from '@material-ui/core';
import { menuStyle } from '../style';

export interface ModuleMenuItemProps {
    menuItem: ModuleMenu;
    setMenuItemActionCreator: any;
    appLanguage: string;
}
function ModuleMenuItem(props: ModuleMenuItemProps) {
    const theme = useTheme();
    const useStyles = makeStyles(menuStyle(theme));
    const classes = useStyles();

    const onClickHandler = (_event: React.MouseEvent<HTMLDivElement>) => {
        const { menuItem } = props;
        props.setMenuItemActionCreator(menuItem);
    };

    return (
        <div className={classes.outerCircle} onClick={onClickHandler}>
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
        </div>
    );
}

/** connect the component to the store */

/** map props to actions */
const mapDispatchToProps = {
    setMenuItemActionCreator: setMenuItem,
};

/** connect clientsList to the redux store */
const ConnectedModuleMenuItem = connect(null, mapDispatchToProps)(ModuleMenuItem);

export default ConnectedModuleMenuItem;
