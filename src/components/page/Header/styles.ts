import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

export const headerStyles = makeStyles((theme: Theme) =>
  createStyles({
    grow: {
      // justifyContent: 'space-between',
    },
    toolbar: {
      display: 'inline-flex',
      justifyContent: 'space-between',
    },
    button: {
      marginLeft: `5px !important`,
      padding: `5px !important`,
      color: `${theme.palette.secondary.light} !important`,
      // backgroundColor: `${theme.palette.secondary.main} !important`,
      borderRadius: `5px !important`,
    },
    backButton: {
      backgroundColor: `${theme.palette.secondary.light} !important`,
      color: `${theme.palette.primary.dark} !important`,
      borderRadius: `5px !important`,
    },
    appbar: {
      backgroundColor: `${theme.palette.primary.light} !important`,
      color: theme.palette.secondary.light,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    sectionDesktop: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'flex',
      },
    },
    sectionMobile: {
      display: 'flex',
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    title: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'block',
      },
    },
  }),
);
