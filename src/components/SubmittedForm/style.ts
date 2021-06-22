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
    datePicker: {
      padding: 20,
    },
    submitButton: {
      backgroundColor: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark

    },
    resetButton: {
      marginLeft: 20,
      backgroundColor: theme.palette.secondary.dark,
      borderColor: theme.palette.secondary.dark
    },
    root: {
      color: theme.palette.info.dark,
      '&.MuiPickersDay-day': {
        color: theme.palette.info.dark,
      },
    },
  });
