import { createStyles, makeStyles, Theme } from '@material-ui/core';

// material ui styles for app meta form component
export const appMetaFormStyles = makeStyles((theme: Theme) =>
  createStyles({
    layout: {
      '& .MuiTextField-root': {
        margin: theme.spacing(1),
        width: '60%',
      },
      marginLeft: theme.spacing(3),
    },
  }),
);
