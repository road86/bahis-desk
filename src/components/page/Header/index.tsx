import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Button } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import SyncIcon from '@material-ui/icons/Sync';
import React from 'react';
import { connect } from 'react-redux';
import { Store } from 'redux';
import { ipcRenderer } from '../../../services/ipcRenderer';
import { isPrevMenuEmpty, setPrevMenu } from '../../../store/ducks/menu';
import { headerStyles } from './styles';

export interface HeaderProps {
  handleLogout: any;
  setSyncOverlayHandler: any;
  syncTime: string;
  setPrevMenuActionCreator: any;
  isBackPossible: boolean;
  pathName: string;
  redirectToMenu: any;
  redirectToSubmitted: any;
  showContent: boolean;
  unsyncCount: any;
  updateUnsyncCount: any;
}

function Header(props: HeaderProps) {
  const { setSyncOverlayHandler } = props;
  const classes = headerStyles();
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);
  const [appConfigSyncComplete, setAppConfigSyncComplete] = React.useState<boolean>(false);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);


  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  React.useEffect(() => {

    if (appConfigSyncComplete) {
      (async () => {
        const user: any = await ipcRenderer.sendSync('fetch-username');
        ipcRenderer.send('request-data-sync', user.username);
      })();
    }

  }, [appConfigSyncComplete]);

  const handleAppSync = async () => {
    if (isMobileMenuOpen) {
      handleMobileMenuClose();
    }
    await setSyncOverlayHandler(true);

    const user: any = await ipcRenderer.sendSync('fetch-username');

    await ipcRenderer.send('start-app-sync', user.username);

    // tslint:disable-next-line: variable-name
    ipcRenderer.on('formSyncComplete', async function (_event: any, _args: any) {
      if (!appConfigSyncComplete)
        setAppConfigSyncComplete(true);
    });

    // tslint:disable-next-line: variable-name
    ipcRenderer.on('dataSyncComplete', async function (_event: any, _args: any) {
      setSyncOverlayHandler(false);
      setAppConfigSyncComplete(false);
      setTimeout(() => props.updateUnsyncCount(), 4000);
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
  };

  const getButtonColor = (): any => {
    console.log('---------- || unsyncCount || ------------', props.unsyncCount);
    return parseInt(props.unsyncCount) === 0 ? 'orange' : 'red';
  }

  return (
    <div className={classes.grow}>
      <AppBar position="fixed" color="inherit" className={classes.appbar}>
        <Toolbar className={classes.toolbar}>
          {props.showContent ? (
            <React.Fragment>
              <div className={classes.menuButton}>
                <Avatar variant="square" src="/icon.png" />
              </div>
              <div>
                <Typography className={classes.title} variant="body2" noWrap={true}>
                  Last Sync Date : {props.syncTime}
                  <Button variant="contained" style={{ backgroundColor: getButtonColor() }} onClick={handleAppSync} className={classes.button}>
                    <SyncIcon style={{ paddingRight: 2 }} />Sync Now
              </Button>
                </Typography>
              </div>
              <div className={classes.sectionDesktop}>

                {props.isBackPossible && <Button variant="contained" color="primary" onClick={onBackHandler} className={classes.backButton}>
                  <FontAwesomeIcon icon={['fas', 'chevron-left']} style={{ marginRight: 3 }} />Back
                  </Button>
                }
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
