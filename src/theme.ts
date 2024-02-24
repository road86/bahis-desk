import { createTheme } from '@material-ui/core/styles';

// TODO this has no impact on forms which needs to be fixed

// default (development) colours
let primary_main = '#009EDB'; // AppBar, Borders, Icons
let primary_light = '#6ED6FF'; // Box backgrounds
let primary_dark = '#004F6E'; // Box backgrounds
const secondary_main = '#DB3E00'; // Button backgrounds
const secondary_light = '#FFFAFB'; // Button text
const secondary_dark = '#2B2C28';
// override based on mode
if (import.meta.env.MODE === 'production') {
    primary_main = '#649a6a';
    primary_light = '#ebfded';
    primary_dark = '#8ac390';
}
export const theme = createTheme({
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
    },
    typography: {
        // h1: {
        //     color: primary_light,
        // },
        // h2: {
        //     fontWeight: 500,
        //     fontSize: 20,
        // },
        // h3: {
        //     fontWeight: 400,
        //     fontSize: 18,
        // },
        h4: {
            color: primary_light, // Sign in text
        },
        // h6: {
        //     fontWeight: 500,
        //     fontSize: 20,
        //     color: primary_light,
        // },
        // body1: {
        //     fontWeight: 400,
        //     fontSize: 16,
        // },
        // caption: {
        //     fontWeight: 600,
        //     fontSize: 16,
        // },
        // subtitle1: {
        //     fontWeight: 400,
        //     fontSize: 16,
        // },
        // subtitle2: {
        //     fontWeight: 500,
        //     fontSize: 16,
        // },
    },
    //menu
    overrides: {
        MuiListItem: {
            root: {
                paddingTop: 12,
                paddingBottom: 12,
                color: '#666666 !important',
                '&:hover': {
                    textDecoration: 'none',
                },
                '&:selected': {
                    color: '#222222',
                    textDecoration: 'none',
                },
            },
        },
        MuiAccordionSummary: {
            root: {
                borderTop: '5px solid',
                borderTopColor: primary_dark,
                color: primary_dark,
                '&:hover': {
                    backgroundColor: primary_dark,
                    color: secondary_light,
                },
                '&$expanded': {
                    backgroundColor: primary_dark,
                    color: secondary_light,
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
        MuiButton: {
            root: {
                height: 40,
            },
            label: {
                fontWeight: 400,
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
