import { createMuiTheme } from '@material-ui/core/styles';

export const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#649A6A',
      dark: '#8ac390',
    },
    secondary: {
      main: '#D2AB16',
      light: '#EBFDED',
      dark: '#AD8C0F',
    },
    // error: {
    //   main: '#f44336',
    // },
    // warning: {
    //   main: '#ff9800',
    // },
    //table stripe
    info: {
      dark: '#F5F4F4',
      main: '#EBFDED',
      light: '#F9F9F9',
    },
    // success: {
    //   main: '#4caf50',
    // },
    text: {
      primary: '#EBFDED',
      secondary: '#000000',
      disabled: 'rgba(0, 0, 0, 0.38)',
      hint: 'rgba(0, 0, 0, 0.38)',
    },
    // divider: 'rgba(0, 0, 0, 0.12)',
    // background: {
    //   paper: '#fff',
    //   default: '#fff',
    // },
    action: {
      // active: '#EEEEEE',
      // hover: '#888888',
      // hoverOpacity: 0.04,
      // selected: '#FFFFFF',
      disabled: '#888888',
    },
  },
  typography: {
    h1: {
      fontWeight: 700,
      // lineHeight: 0.35,
      fontSize: 30,
      color: '#EBFDED',
    },
    h2: {
      fontWeight: 500,
      fontSize: 20,
      // lineHeight: 0.23,
    },
    h3: {
      fontWeight: 400,
      fontSize: 18,
      // lineHeight: 0.21,
      // color: '#FFFFFF',
    },
    h4: {
      fontWeight: 700,
      // lineHeight: 0.35,
      fontSize: 26,
      color: '#EBFDED',
    },
    h6: {
      fontWeight: 500,
      // lineHeight: 0.35,
      fontSize: 20,
      color: '#EBFDED',
    },
    body1: {
      fontFamily: 'Roboto',
      fontWeight: 400,
      // lineHeight: 1.18,
      // color: '#EBFDED',
      fontSize: 16,
    },
    caption: {
      fontFamily: 'Roboto',
      fontWeight: 600,
      // lineHeight: 0.18,
      fontSize: 16,
    },
    subtitle1: {
      fontFamily: 'Roboto',
      fontWeight: 400,
      // lineHeight: 0.18,
      fontSize: 16,
    },
    subtitle2: {
      fontFamily: 'Roboto',
      fontWeight: 500,
      // lineHeight: 0.18,
      fontSize: 16,
    },
  },
  //menu
  overrides: {
    MuiListItem: {
      root: {
        paddingTop: 12,
        paddingBottom: 12,
        color: '#666666 !important',
        '&:hover': {
          // backgroundColor: '#EBFDED',
          textDecoration: 'none',
        },
        '&:selected': {
          color: '#222222',
          textDecoration: 'none',
        },
      },
    },
    MuiPaper: {
      root: {
        color: '#222222 !important',
      },
    },
    MuiInputLabel: {
      outlined: {
        color: '#222222',
      },
    },
    MuiInputBase: {
      root: {
        color: '#222222',
      },
    },
    MuiAccordionSummary: {
      root: {
        borderTop: '5px solid',
        borderTopColor: '#8ac390 !important',
        color: '#8ac390',
        '&:hover': {
          backgroundColor: '#8ac390 !important',
          color: '#EBFDED !important',
        },
        '&$expanded': {
          backgroundColor: '#8ac390 !important',
          color: '#EBFDED !important',
        },
      },
    },
    MuiTableCell:{
      body: {
        color: '#222222'
      },
      stickyHeader: {
        backgroundColor: '#649A6A'
      }
    },
    MuiTableSortLabel : {
        icon: {
          color: '#EBFDED !important'
        }
    },
    MuiStepIcon: {
      active: {
        color: '#649A6A',
      },
      // completed: {
      //   color: '#8ac390 !important',
      // },
      // active: {
      //
      // }
    },
    MuiStepLabel: {
      label: {
        color: '#649A6A',
      },
    },
    MuiStepConnector: {
      line: {
        color: '#EBFDED',
      },
    },
    MuiTypography: {
      root: {
        fontStyle: 'normal',
      },
    },
    MuiTextField: {
      root: {
        backgroundColor: '#EBFDED',
        borderRadius: 5,
      },
    },
    MuiFormControlLabel : {
      root: {
        color: '#EBFDED',
      },
    },
    MuiTablePagination: {
      caption: {
        color: '#222222',
      },
      actions: {
        color: '#666666'
      }
    },
    MuiPickersDay: {
      day: {
        color: '#a9a3a3',
      },
      current: {
        color: '#649A6A',
      },
    },
    MuiButton: {
      root: {
        height: 40,
      },
      label: {
        fontWeight: 400,
        // fontSize: 16,
        // lineHeight: 0.18,
        // color: '#EBFDED',
        fontFamily: 'Roboto',
      },
      containedPrimary: {
        color: '#FFFFFF',
      },
    },
    MuiRadio: {
      root: {
        color: '#EBFDED',
      },
    },
    MuiSelect: {
      select: {
        color: '#222222',
      },
    },
  },
});
