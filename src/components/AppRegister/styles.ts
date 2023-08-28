import { createStyles, Theme } from '@material-ui/core';

export const registerStyles = (theme: Theme) =>
    createStyles({
        button: {
            marginLeft: theme.spacing(1),
            marginTop: theme.spacing(3),
            color: theme.palette.secondary.light,
        },
        buttons: {
            display: 'flex',
            justifyContent: 'center',
        },
        layout: {
            marginLeft: theme.spacing(2),
            marginRight: theme.spacing(2),
            [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
                marginLeft: 'auto',
                marginRight: 'auto',
                width: 600,
            },
            width: 'auto',
        },
        paper: {
            marginBottom: theme.spacing(3),
            marginTop: theme.spacing(3),
            padding: theme.spacing(2),
            [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
                marginBottom: theme.spacing(6),
                marginTop: theme.spacing(6),
                padding: theme.spacing(3),
            },
            backgroundColor: theme.palette.primary.dark,
        },
        stepper: {
            padding: theme.spacing(3, 0, 3),
            backgroundColor: theme.palette.primary.dark,
        },
        circle: {
            height: 100,
            width: 100,
            borderRadius: 50,
            borderWidth: 5,
            borderStyle: 'solid',
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.info.main,
            position: 'relative',
        },
        image: {
            position: 'absolute',
            borderRadius: 50,
            height: 50,
            width: 50,
            top: 25,
            left: 25,
        },
        radio: {
            '&.PrivateRadioButtonIcon-root': {
                color: theme.palette.secondary.light,
                '&.Mui-selected': { color: theme.palette.primary.dark },
            },
        },
    });
