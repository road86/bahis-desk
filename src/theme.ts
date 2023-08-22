import { createTheme as createMuiTheme } from '@material-ui/core/styles';

// TODO this has no impact on forms which needs to be fixed

// default (development) colours
let primary_main = '#009EDB'; // AppBar, Borders, Icons
let primary_light = '#6ED6FF'; // Box backgrounds
let primary_dark = '#004F6E'; // Box backgrounds
const secondary_main = '#DB3E00'; // Button backgrounds
const secondary_light = '#FFFAFB'; // Button text
const secondary_dark = '#2B2C28';
// override based on mode
if (import.meta.env.MODE === 'staging') {
    primary_main = '#FF0000';
    primary_dark = '#AA0000';
} else if (import.meta.env.MODE === 'production') {
    primary_main = '#649a6a';
    primary_light = '#ebfded';
    primary_dark = '#8ac390';
}
export const theme = createMuiTheme({
    palette: {
        primary: {
            main: primary_main,
            light: primary_light,
            dark: primary_dark,
        },
        secondary: {
            main: secondary_main,
            light: secondary_light,
            dark: secondary_dark,
        },
        error: {
            main: '#f44336',
        },
        warning: {
            main: '#ff9800',
        },
        //table stripe
        info: {
            dark: '#F5F4F4',
            main: primary_light,
            light: '#F9F9F9',
        },
        // success: {
        //   main: '#4caf50',
        // },
        text: {
            primary: primary_light,
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
            color: primary_light,
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
            color: primary_light,
        },
        h6: {
            fontWeight: 500,
            // lineHeight: 0.35,
            fontSize: 20,
            color: primary_light,
        },
        body1: {
            fontFamily: 'Roboto',
            fontWeight: 400,
            // lineHeight: 1.18,
            // color: primary_light,
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
                    // backgroundColor: primary_light,
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
                borderTopColor: primary_dark,
                color: primary_dark,
                '&:hover': {
                    backgroundColor: primary_dark,
                    color: primary_light,
                },
                '&$expanded': {
                    backgroundColor: primary_dark,
                    color: primary_light,
                },
            },
        },
        MuiTableCell: {
            body: {
                color: '#222222',
            },
            stickyHeader: {
                backgroundColor: primary_main,
            },
        },
        MuiTableSortLabel: {
            icon: {
                color: primary_light,
            },
        },
        MuiStepIcon: {
            active: {
                color: primary_main,
            },
            // completed: {
            //   color: primary_dark,
            // },
            // active: {
            //
            // }
        },
        MuiStepLabel: {
            label: {
                color: primary_main,
            },
        },
        MuiStepConnector: {
            line: {
                color: primary_light,
            },
        },
        MuiTypography: {
            root: {
                fontStyle: 'normal',
            },
        },
        MuiTextField: {
            root: {
                backgroundColor: secondary_light,
                borderRadius: 5,
            },
        },
        MuiFormControlLabel: {
            root: {
                color: primary_light,
            },
        },
        MuiTablePagination: {
            caption: {
                color: '#222222',
            },
            actions: {
                color: '#666666',
            },
        },
        // MuiPickersDay: {
        //     day: {
        //         color: '#a9a3a3',
        //     },
        //     current: {
        //         color: primary_main,
        //     },
        // },
        MuiButton: {
            root: {
                height: 40,
            },
            label: {
                fontWeight: 400,
                // fontSize: 16,
                // lineHeight: 0.18,
                // color: primary_light,
                fontFamily: 'Roboto',
            },
            containedPrimary: {
                color: '#FFFFFF',
            },
        },
        MuiRadio: {
            root: {
                color: primary_light,
            },
        },
        MuiSelect: {
            select: {
                color: '#222222',
            },
        },
    },
});
