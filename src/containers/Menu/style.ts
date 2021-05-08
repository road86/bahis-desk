import { createStyles, Theme } from '@material-ui/core';

export const menuStyle = (theme: Theme) =>
  createStyles({
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
  });
