import { createStyles, Theme } from '@material-ui/core';

export const filterStyles = (theme: Theme) =>
    createStyles({
        filterContainer: {
            margin: '20 5',
            padding: 25,
            backgroundColor: '#f9fcf2',
            border: '1px solid',
            borderColoe: theme.palette.primary.dark,
            borderRadius: 5,
            boxShadow: '0 1 3 0 #b4be60',
            color: '#687459',
        },

        filterTitleUnderline: {
            borderBottom: '1px solid #b0c7a6',
        },

        bgFilterTitle: {
            marginTop: 15,
            marginBottom: 15,
        },

        submitButton: {
            backgroundColor: theme.palette.primary.dark,
            borderColor: theme.palette.primary.dark,
        },

        resetButton: {
            marginLeft: 20,
            backgroundColor: theme.palette.secondary.dark,
            borderColor: theme.palette.secondary.dark,
        },
    });
