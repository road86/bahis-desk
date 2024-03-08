import { createTheme } from '@mui/material/styles';

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
});
