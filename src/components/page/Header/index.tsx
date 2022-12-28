import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Button } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import SyncIcon from '@material-ui/icons/Sync';
import React from 'react';
import { useState } from 'react';
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
  fetchLastSyncTime: any;
}

function Header(props: HeaderProps) {

  const classes = headerStyles();
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);
  const [appConfigSyncComplete, setAppConfigSyncComplete] = React.useState<boolean>(false);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const [isDisabledSyncConfig, setDisabledSyncConfig] = useState(false);
  const [isDisabledSyncData, setDisabledSyncData] = useState(false);

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

  const handleAppSync = async () => {
    setDisabledSyncData(true);
    if (isMobileMenuOpen) {
      handleMobileMenuClose();
    }

    const user: any = await ipcRenderer.sendSync('fetch-username','sync button');

    await ipcRenderer.send('request-data-sync', user.username);
    setDisabledSyncConfig(true);
    await ipcRenderer.send('start-app-sync', user.username);

    // tslint:disable-next-line: variable-name
    ipcRenderer.on('formSyncComplete', async function (_event: any, _args: any) {
      console.log("Finished clicked sync");
      setDisabledSyncConfig(false);
      props.fetchLastSyncTime();
      if (!appConfigSyncComplete)
        setAppConfigSyncComplete(true);
    });

    // tslint:disable-next-line: variable-name
    ipcRenderer.on('dataSyncComplete', async function (_event: any, _args: any) {
      setAppConfigSyncComplete(false);
      setDisabledSyncData(false);
      props.updateUnsyncCount();
      props.fetchLastSyncTime();
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
    setDisabledSyncData(false);
  };

  const getButtonColor = (): any => {
    console.log('Getting button colour');
    console.log('---------- || unsyncCount || ------------', props.unsyncCount);
    return props.unsyncCount === 0 ? "orange" : "red";
  }

  return (
    <div className={classes.grow}>
      <AppBar position="fixed" color="inherit" className={classes.appbar}>
        <Toolbar className={classes.toolbar}>
          {props.showContent ? (
            <React.Fragment>
              <div className={classes.menuButton}>
                <Avatar variant="square" src="/../../../assets/images/debuglogo.png" />
              </div>
              <div className="syncBar">
                {props.syncTime && (
                  <Typography className={classes.title} variant="body2" noWrap={true}>
                    Time of last data submission: {props.syncTime}
                  </Typography>
                )}

                {!props.syncTime && (
                  <Typography className={classes.title} variant="body2" noWrap={true}>
                    Please synchronise the app after logging in.
                  </Typography>
                )}

                <Button
                  variant="contained"
                  style={{ backgroundColor: getButtonColor() }}
                  onClick={handleAppSync}
                  className={classes.button}
                  disabled={isDisabledSyncConfig || isDisabledSyncData}
                >
                  Sync Now
                </Button>
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
