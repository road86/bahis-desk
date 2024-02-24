import { createStyles, Theme } from '@material-ui/core';

export const menuStyle = (theme: Theme) =>
    createStyles({
        menuGrid: {
            padding: 10,
        },
        menuButton: {
            aspectRatio: '1/1',
            width: '100%',
            border: `20px solid ${theme.palette.primary.main}`,
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            textAlign: 'center',
            padding: 10,
        },
        latestImprovements: {
            maxHeight: '300px',
            overflowY: 'scroll',
        },
    });
