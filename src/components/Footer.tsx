import { AppBar, Typography } from '@mui/material';
import packageJson from '../../package.json';

export const Footer = () => {
    return (
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
            <Typography align="center">{`BAHIS Desk Version ${packageJson.version}`}</Typography>
        </AppBar>
    );
};
