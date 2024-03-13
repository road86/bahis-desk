import { AppBar, Box, Typography } from '@mui/material';
import React from 'react';
import packageJson from '../../package.json'; // TODO probably replace this wit a call to electron's app.getVersion()
import { NetworkIndicator } from './NetworkIndicator';
import { ipcRenderer } from 'electron';

export interface FooterProps {
    lastSyncTime?: string;
}

export const Footer: React.FC<FooterProps> = ({ lastSyncTime }) => {
    return (
        <AppBar position="fixed" sx={{ top: 'auto', bottom: 0, justifyContent: 'space-evenly', flexDirection: 'row' }}>
            <Typography sx={{ marginLeft: 3 }}>Time of last synchronisation: {lastSyncTime}</Typography>
            <Typography>{`BAHIS Desk Version ${packageJson.version}`}</Typography>
            <NetworkIndicator />
        </AppBar>
    );
};
