import { Icon, Typography, makeStyles, useTheme } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { MenuItem, MenuItemTypes } from '../../../store/ducks/menu';
import { menuStyle } from '../style';

interface ListMenuItemProps {
    menuItem: MenuItem;
}

export default function ListMenuItem(props: ListMenuItemProps) {
    const theme = useTheme();
    const useStyles = makeStyles(menuStyle(theme));
    const classes = useStyles();

    let url = '';
    if (props.menuItem.module_type === MenuItemTypes.list) {
        url = `/list/${props.menuItem.form}/`;
    } else if (props.menuItem.module_type === MenuItemTypes.form) {
        url = `/form/${props.menuItem.form}/`;
    } else if (props.menuItem.module_type === MenuItemTypes.iframe) {
        url = `/iframe?url=${props.menuItem.external_url}`;
    } else if (props.menuItem.module_type === MenuItemTypes.submitted) {
        url = `/formlist/${props.menuItem.form}/`;
    }

    return (
        <Link to={url}>
            <div className={classes.menuButton}>
                <Typography variant="h4" color={'primary'}>
                    {props.menuItem.title}
                </Typography>
                <Icon fontSize="large" color={'primary'}>
                    {props.menuItem.icon}
                </Icon>
                <Typography>{props.menuItem.description ?? ''}</Typography>
            </div>
        </Link>
    );
}
