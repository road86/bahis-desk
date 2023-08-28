import { createStyles, Theme } from '@material-ui/core';

export const menuStyle = (theme: Theme) =>
    createStyles({
        outerCircle: {
            aspectRatio: '1/1',
            width: '100%',
            border: `20px solid ${theme.palette.primary.main}`,
            borderRadius: 10,
            display: 'grid',
            alignItems: 'center',
        },
        circle: {
            margin: 'auto auto',
            justifyContent: 'center',
            display: 'flex',
        },
        innerDiv: {
            width: '100%',
            textAlign: 'center',
            marginBottom: 20,
        },
        image: {
            display: 'table-cell',
            verticalAlign: 'middle',
            color: theme.palette.primary.main,
        },
        iconClass: {
            height: 60,
            width: 70,
            top: 5,
            left: 5,
            color: theme.palette.primary.main,
        },
        labelClass: {},
        latestImprovements: {
            maxHeight: '300px',
            overflowY: 'scroll',
        },
    });
