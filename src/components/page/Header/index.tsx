import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Button, AppBar, Toolbar, Typography, Snackbar, Badge, CircularProgress} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Store } from 'redux';
import { ipcRenderer } from '../../../services/ipcRenderer';
import { isPrevMenuEmpty, setPrevMenu } from '../../../store/ducks/menu';
import { headerStyles } from './styles';

export interface HeaderProps {
  handleLogout: any;
  syncTime: string | null;
  setPrevMenuActionCreator: any;
  isBackPossible: boolean;
  pathName: string;
  redirectToMenu: any;
  redirectToSubmitted: any;
  showContent: boolean;
  unsyncCount: number;
  updateUnsyncCount: any;
  setLastSyncTime: any;
}

function Header(props: HeaderProps) {
  const classes = headerStyles();
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);
  const [appConfigSyncComplete, setAppConfigSyncComplete] = React.useState<boolean>(false);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const [isWaitingForFormSync, setWaitingForFormSync] = useState(false);
  const [isWaitingForDataSync, setWaitingForDataSync] = useState(false);

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  // React.useEffect(() => {
  //   console.log("when does it run?")
  //   if (appConfigSyncComplete) {
  //     (async () => {
  //       console.log('In header fethich usenamge and requesting dat async')
  //       const user: any = await ipcRenderer.sendSync('fetch-username','appcinf end');
  //       ipcRenderer.send('request-data-sync', user.username);
  //     })();
  //   }

  // }, [appConfigSyncComplete]);

  // React.useEffect(() => {
  //   setTimeout(() => {
  //     setWaitingForFormSync(false);
  //   }, 45000);
  // }, [isWaitingForFormSync]);
  //
  // React.useEffect(() => {
  //   setTimeout(() => {
  //     setWaitingForDataSync(false);
  //   }, 45000);
  // }, [isWaitingForDataSync]);

  const handleClose = () => {
    setWaitingForFormSync(false);
    setWaitingForDataSync(false);
  }

  const handleAppSync = async () => {
    props.setLastSyncTime('Sync in progress');
    setWaitingForFormSync(true);
    setWaitingForDataSync(true);

    if (isMobileMenuOpen) {
      handleMobileMenuClose();
    }

    const user: any = await ipcRenderer.sendSync('fetch-username', 'sync button');
    await ipcRenderer.send('request-data-sync', user.username);
    await ipcRenderer.send('start-app-sync', user.username);

    ipcRenderer.on('formSyncComplete', async function (_event: any, _args: any) {
      console.log(`----- || Finished form sync with message: ${_args}|| -----`);
      if (!appConfigSyncComplete) {
        setAppConfigSyncComplete(true);
      }
      setWaitingForFormSync(false);
    });

    ipcRenderer.on('dataSyncComplete', async function (_event: any, _args: any) {
      console.log(`----- || Finished data sync with message: ${_args} || -----`);
      setAppConfigSyncComplete(false);
      props.updateUnsyncCount();
      props.setLastSyncTime();
      setWaitingForDataSync(false);
      setTimeout(()=>{
        setWaitingForDataSync(false);
        setWaitingForFormSync(false);
        
      }, 1000)
    });
  };

  // tslint:disable-next-line: variable-name
  const onBackHandler = (_event: React.MouseEvent<HTMLElement>) => {
    if (isMobileMenuOpen) {
      handleMobileMenuClose();
    }
    if (props.pathName.includes('form') || props.pathName.includes('list')) {
      props.redirectToMenu();
    } else if (props.pathName.includes('submittedDetails')) {
      props.redirectToSubmitted();
    } else {
      props.setPrevMenuActionCreator();
    }
    // allow re-sync after clicking back button for now. It will however wait for the sync to complete, not sure how that works
    setWaitingForDataSync(false);
  };

  const getButtonColor = (): any => {
    console.log('Getting button colour');
    //check unsync count on load the application
    props.updateUnsyncCount();
    console.log('---------- || unsyncCount || ------------', props.unsyncCount);
    return props.unsyncCount === 0 ? '#00B755' : 'red';
  };

  const Toast = () => (
    <Snackbar
      open={isWaitingForFormSync || isWaitingForDataSync}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      key={'topcenter'}
    >
      <Alert severity="info" onClose={handleClose} icon={false}><CircularProgress size={"1rem"}/> Synchronising data.</Alert>
    </Snackbar>
  );

  return (
    <div className={classes.grow}>
      <AppBar position="fixed" color="inherit" className={classes.appbar}>
        {(isWaitingForFormSync || isWaitingForDataSync) && <Toast />}
        <Toolbar className={classes.toolbar}>
          {props.showContent ? (
            <React.Fragment>
              <div className={classes.menuButton}>
                <Avatar variant="square" src="/../../../assets/images/debuglogo.png" />
              </div>
              <div className="syncBar">
                {props.syncTime && (
                  <Typography className={classes.title} variant="body2" noWrap={true}>
                    Time of last synchronisation: {props.syncTime}
                  </Typography>
                )}

                {!props.syncTime && (
                  <Typography className={classes.title} variant="body2" noWrap={true}>
                    Please synchronise the app after logging in.
                  </Typography>
                )}
                <Badge badgeContent={props.unsyncCount} color="secondary">
                  <Button
                    variant="contained"
                    style={{ backgroundColor: getButtonColor() }}
                    onClick={handleAppSync}
                    className={classes.button}
                    disabled={isWaitingForFormSync || isWaitingForDataSync}
                  >
                    Sync Now
                  </Button>
                </Badge>
              </div>
              <div className={classes.sectionDesktop}>
                {props.isBackPossible && (
                  <Button variant="contained" color="primary" onClick={onBackHandler} className={classes.backButton}>
                    <FontAwesomeIcon icon={['fas', 'chevron-left']} style={{ marginRight: 3 }} />
                    Back
                  </Button>
                )}
              </div>
            </React.Fragment>
          ) : null}
        </Toolbar>
      </AppBar>
    </div>
  );
}

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  isBackPossible: boolean;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const result = {
    isBackPossible: !isPrevMenuEmpty(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  setPrevMenuActionCreator: setPrevMenu,
};

/** connect clientsList to the redux store */
const ConnectedHeader = connect(mapStateToProps, mapDispatchToProps)(Header);

export default ConnectedHeader;
