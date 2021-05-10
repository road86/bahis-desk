import { createStyles, Theme } from '@material-ui/core';

export const menuStyle = (theme: Theme) =>
  createStyles({
    outerCircle: {
        height: 220,
        width: 220,
        borderRadius: 110,
        backgroundColor: theme.palette.secondary.main,
        margin: 10,
        display: 'flex'
    },
    circle: {
      height: 100,
      width: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.info.main,
      display: 'table'
    },
    innerDiv: {
        margin: 'auto auto',
        textAlign: 'center',
        maxWidth: 'min-content',
        verticalAlign: 'middle'
    },
    image: {
        display: 'table-cell',
        verticalAlign: 'middle'
    },
    iconClass: {
      height: 50,
      width: 50,
      top: 5,
      left: 5,
    },
    labelClass: {}
  });
