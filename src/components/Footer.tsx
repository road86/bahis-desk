import { AppBar, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { NetworkIndicator } from './NetworkIndicator';
import { ipcRenderer } from 'electron';

export interface FooterProps {
    lastSyncTime?: string;
}

export const Footer: React.FC<FooterProps> = ({ lastSyncTime }) => {
    const [version, setVersion] = useState<string>('');

    useEffect(() => {
        ipcRenderer
            .invoke('read-app-version')
            .then((version) => {
                setVersion(version);
            })
            .catch((error) => {
                console.error('Error reading app version:', error);
            });
    }, []);

    return (
        <AppBar position="fixed" sx={{ top: 'auto', bottom: 0, justifyContent: 'space-evenly', flexDirection: 'row' }}>
            <Typography sx={{ marginLeft: 3 }}>Time of last synchronisation: {lastSyncTime}</Typography>
            <Typography>{`BAHIS Desk Version ${version}`}</Typography>
            <NetworkIndicator />
        </AppBar>
    );
};
