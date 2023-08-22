import { createStyles, Theme } from '@material-ui/core';

export const menuStyle = (theme: Theme) =>
    createStyles({
        outerCircle: {
            height: 220,
            width: '110%',
            borderRadius: 10,
            backgroundColor: theme.palette.info.main,
            borderWidth: '12px 20px',
            border: `solid ${theme.palette.primary.main}`,
            display: 'grid',
            alignItems: 'end',
        },
        circle: {
            margin: 'auto auto',
            // height: 100,
            // width: 100,
            // borderRadius: 50,
            // borderWidth: 2,
            // borderStyle: 'solid',
            // borderColor: theme.palette.primary.main,
            // backgroundColor: theme.palette.info.main,
            justifyContent: 'center',
            display: 'flex',
        },
        innerDiv: {
            width: '100%',
            textAlign: 'center',
            marginBottom: 20,
            // maxWidth: 'min-content',
            // verticalAlign: 'middle'
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
    });
