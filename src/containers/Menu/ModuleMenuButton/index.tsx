import { Icon, Typography, makeStyles, useTheme } from '@material-ui/core';
import * as React from 'react';
import { connect } from 'react-redux';
import { ModuleMenu, setMenuItem } from '../../../store/ducks/menu';
import { menuStyle } from '../style';

export interface ModuleMenuItemProps {
    menuItem: ModuleMenu;
    setMenuItemActionCreator: any;
}
function ModuleMenuItem(props: ModuleMenuItemProps) {
    const theme = useTheme();
    const useStyles = makeStyles(menuStyle(theme));
    const classes = useStyles();

    const onClickHandler = (_event: React.MouseEvent<HTMLDivElement>) => {
        props.setMenuItemActionCreator(props.menuItem.id);
    };

    return (
        <div className={classes.menuButton} onClick={onClickHandler}>
            <Typography variant="h4" color={'primary'}>
                {props.menuItem.title}
            </Typography>
            <Icon fontSize="large" color={'primary'}>
                {props.menuItem.icon}
            </Icon>
            <Typography>{props.menuItem.description ?? ''}</Typography>
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
