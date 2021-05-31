import { createStyles, Theme } from '@material-ui/core';

export const listPageStyles = (theme: Theme) =>
  createStyles({
    hrTag: {
      height: 2,
      backgroundColor: theme.palette.primary.dark
    },
    header: {
      marginBottom: 0,
      color: theme.palette.primary.dark
    },
  });
