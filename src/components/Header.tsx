import { Button, Alert, AppBar, Toolbar, Typography, Snackbar, Badge, CircularProgress, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SyncIcon from '@mui/icons-material/Sync';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import React, { useEffect, useState } from 'react';
import { ipcRenderer } from '../services/ipcRenderer';
import { log } from '../helpers/log';
import { theme } from '../theme';
import { useNavigate } from 'react-router-dom';

export interface HeaderProps {
    pathName?: string;
}

const getUnsyncCount = async () => {
    log.info('update Unsync Count');
    return ipcRenderer.invoke('get-local-db', 'select count(*) as cnt from data2 where status != 1').then((response) => {
        return response[0].cnt;
    });
};

export const Header = (props: HeaderProps) => {
    const [appConfigSyncComplete, setAppConfigSyncComplete] = useState<boolean>(false);
    const [unsyncCount, setUnsyncCount] = useState<number>(0);

    const [isWaitingForFormSync, setWaitingForFormSync] = useState(false);
    const [isWaitingForDataSync, setWaitingForDataSync] = useState(false);

    const navigate = useNavigate();

    log.debug(`Current path: ${props.pathName}`);

    useEffect(() => {
        getUnsyncCount().then((unsyncCount) => setUnsyncCount(unsyncCount));
    }, []);

    const handleClose = () => {
        setWaitingForFormSync(false);
        setWaitingForDataSync(false);
    };

    const handleAppSync = async () => {
        setWaitingForFormSync(true);
        setWaitingForDataSync(true);

        await ipcRenderer.send('request-user-data-sync');
        await ipcRenderer.invoke('request-app-data-sync');

        ipcRenderer.on('formSyncComplete', async function (_event: any, _args: any) {
            log.info(` Finished form sync with message: ${_args}`);
            if (!appConfigSyncComplete) {
                setAppConfigSyncComplete(true);
            }
            setWaitingForFormSync(false);
        });

        ipcRenderer.on('dataSyncComplete', async function (_event: any, _args: any) {
            log.info(` Finished data sync with message: ${_args} `);
            setAppConfigSyncComplete(false);
            getUnsyncCount().then((unsyncCount) => setUnsyncCount(unsyncCount));
            getLastSyncTime().then((time) => setLastSyncTime(time));
            setWaitingForDataSync(false);
            setTimeout(() => {
                setWaitingForDataSync(false);
                setWaitingForFormSync(false);
            }, 1000);
        });
    };

    const onBackHandler = (_event: React.MouseEvent<HTMLElement>) => {
        navigate(-1);
        // allow re-sync after clicking back button for now. It will however wait for the sync to complete, not sure how that works
        setWaitingForDataSync(false);
    };

    const onHomeHandler = (_event: React.MouseEvent<HTMLElement>) => {
        navigate('/menu/0');
    };

    const getButtonColor = (): any => {
        log.info('Getting button colour');
        //check unsync count on load the application
        log.info(' unsyncCount ', getUnsyncCount());
        return unsyncCount === 0 ? theme.palette.primary.main : theme.palette.secondary.main;
    };

    const Toast = () => (
        <Snackbar
            open={isWaitingForFormSync || isWaitingForDataSync}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            key={'topcenter'}
        >
            <Alert severity="info" onClose={handleClose} icon={false}>
                <CircularProgress size={'1rem'} /> Synchronising data.
            </Alert>
        </Snackbar>
    );

    return (
        <AppBar position="static">
            {(isWaitingForFormSync || isWaitingForDataSync) && <Toast />}
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Button color="inherit" onClick={onHomeHandler} startIcon={<HomeIcon />}>
                    Home
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Badge badgeContent={unsyncCount} color="secondary" overlap="rectangular">
                        <Button
                            variant="contained"
                            style={{ backgroundColor: getButtonColor() }}
                            onClick={handleAppSync}
                            disabled={isWaitingForFormSync || isWaitingForDataSync}
                        >
                            <SyncIcon />
                            Sync Now
                        </Button>
                    </Badge>
                </Box>
                <Button color="inherit" onClick={onBackHandler} startIcon={<ArrowBackIcon />}>
                    Back
                </Button>
            </Toolbar>
        </AppBar>
    );
};
