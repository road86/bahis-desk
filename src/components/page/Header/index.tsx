import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Button } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Badge from '@material-ui/core/Badge';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
// import AccountCircle from '@material-ui/icons/AccountCircle';
import MoreIcon from '@material-ui/icons/MoreVert';
import SyncIcon from '@material-ui/icons/Sync';
// import SystemUpdateAltIcon from '@material-ui/icons/SystemUpdateAlt';
import { delay } from 'q';
import React from 'react';
import { connect } from 'react-redux';
import { Store } from 'redux';
import { dataSync } from '../../../helpers/utils';
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
}

function Header(props: HeaderProps) {
  const { setSyncOverlayHandler } = props;
  const classes = headerStyles();
  // const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);

  // const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  // const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
  //   setAnchorEl(event.currentTarget);
  // };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  // const handleMenuClose = () => {
  //   // setAnchorEl(null);
  //   handleMobileMenuClose();
  // };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleAppSync = async () => {
    if (isMobileMenuOpen) {
      handleMobileMenuClose();
    }
    setSyncOverlayHandler(true);
    await delay(500);
    await dataSync();
    await delay(1000);
    setSyncOverlayHandler(false);
  };

  // const menuId = 'primary-search-account-menu';
  // const renderMenu = (
  //   <Menu
  //     anchorEl={anchorEl}
  //     anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
  //     id={menuId}
  //     keepMounted={true}
  //     transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  //     open={isMenuOpen}
  //     onClose={handleMenuClose}
  //   >
  //     <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
  //     <MenuItem onClick={handleLogout}>Logout</MenuItem>
  //   </Menu>
  // );

  
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

  const mobileMenuId = 'primary-search-account-menu-mobile';

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={mobileMenuId}
      keepMounted={true}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem onClick={handleAppSync}>
        <IconButton aria-label="data sync icon" color="inherit">
          <Badge variant="dot" overlap="circle" color="secondary" invisible={true}>
            <SyncIcon />
          </Badge>
        </IconButton>
        <Typography variant="inherit">Sync</Typography>
      </MenuItem>
      {props.isBackPossible && <MenuItem onClick={onBackHandler}>
        <IconButton
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <FontAwesomeIcon icon={['fas', 'chevron-left']}  style={{ marginRight: 3 }}/>
        </IconButton>
        <Typography variant="inherit">Back</Typography>
      </MenuItem>}
    </Menu>
  );


  return (
    <div className={classes.grow}>
      <AppBar position="fixed" color="inherit" className={classes.appbar}>
        <Toolbar className={classes.toolbar}>
          <div className={classes.menuButton}>
            <Avatar variant="square" src="/icon.png" />
          </div>
          <div>
            <Typography className={classes.title} variant="body2" noWrap={true}>
              Last Sync Date : {props.syncTime} 
              <Button variant="contained" color="secondary" onClick={handleAppSync} className={classes.button}>
                  <SyncIcon style={{ paddingRight: 2 }}/>Sync Now
              </Button>
            </Typography>
          </div>
          <div className={classes.sectionDesktop}>
            {/* <IconButton aria-label="system update icon" color="inherit">
              <Badge variant="dot" overlap="circle" color="secondary" invisible={true}>
                <SystemUpdateAltIcon />
              </Badge>
            </IconButton>
            <IconButton aria-label="data sync icon" color="inherit" onClick={handleAppSync}>
              <Badge variant="dot" overlap="circle" color="secondary" invisible={true}>
                <SyncIcon />
              </Badge>
            </IconButton> */}
            {props.isBackPossible && <Button variant="contained" color="primary" onClick={onBackHandler} className={classes.backButton}>
                <FontAwesomeIcon icon={['fas', 'chevron-left']}  style={{ marginRight: 3 }}/>Back
            </Button>}
            {/* <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton> */}
          </div>
          <div className={classes.sectionMobile}>
            <IconButton
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {/* {renderMenu} */}
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
