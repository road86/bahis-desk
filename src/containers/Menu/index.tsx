import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Container,
    Grid,
    Snackbar,
    makeStyles,
    useTheme,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Alert from '@material-ui/lab/Alert';
import reducerRegistry from '@onaio/redux-reducer-registry';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
import { Store } from 'redux';
import { logger } from '../../helpers/logger';
import { ipcRenderer } from '../../services/ipcRenderer';
import menuReducer, {
    MenuItem,
    MenuItemTypes,
    getCurrentMenu,
    isPrevMenuEmpty,
    reducerName as menuReducerName,
    resetMenu,
    setMenuItem,
    setPrevMenu,
} from '../../store/ducks/menu';
import ModuleMenuButton from './ModuleMenuButton';
import MenuButton from './MenuButton';
import { menuStyle } from './style';

/** register the clients reducer */
reducerRegistry.register(menuReducerName, menuReducer);

export interface MenuProps {
    setMenuItemActionCreator: any;
    setPrevMenuActionCreator: any;
    resetMenuActionCreator: any;
    currentMenu: MenuItem | null;
    isBackPossible: boolean;
}

const Menu: React.FC<RouteComponentProps & MenuProps> = (props: RouteComponentProps & MenuProps) => {
    // TODO this Syncronising Alert should be part of the main app or the menu or something so it can happen across all screens
    const [isSynchronisingAlertOpen, setSynchronisingAlertOpen] = useState<boolean>(false);
    const [menuModules, setmenuModules] = useState<[]>([]);

    const theme = useTheme();
    const useStyles = makeStyles(menuStyle(theme));
    const classes = useStyles();

    const readModulesWithParent = (parent_module_id: any = null) => {
        setSynchronisingAlertOpen(true);
        logger.info(`reading modules with parent_module_id: ${parent_module_id}`);
        let query = 'SELECT DISTINCT * FROM module WHERE parent_module_id';
        if (parent_module_id) {
            query += ` = ${parent_module_id}`;
        } else {
            query += ' IS NULL';
        }
        const modules = ipcRenderer.sendSync('fetch-query-data', query);
        logger.debug(`modules: ${JSON.stringify(modules)}`);
        setSynchronisingAlertOpen(false);
        setmenuModules(modules);
    };

    const typeEvalutor = (menuItem: MenuItem) => {
        if (menuItem.module_type_id === MenuItemTypes.module) {
            return <ModuleMenuButton menuItem={menuItem} />;
        } else {
            return <MenuButton menuItem={menuItem} />;
        }
    };

    const handleClose = () => {
        setSynchronisingAlertOpen(false);
    };

    useEffect(() => {
        readModulesWithParent(props.currentMenu);
    }, [props.currentMenu]);

    return (
        <Container style={{ marginTop: '20px' }}>
            <Snackbar open={isSynchronisingAlertOpen} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} key={'topleft'}>
                <Alert severity="info" onClose={handleClose}>
                    Attempting to sync modules. This may take some time. If nothing happens after five minutes try hitting the
                    Sync Now.
                </Alert>
            </Snackbar>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
                    Latest Improvements
                </AccordionSummary>
                <AccordionDetails className={classes.latestImprovements}>
                    <ul>
                        <li>
                            (2023-08-17) Previously some data was not pulled to the app if a synchronisation request failed,
                            now the application will retry the request up to 5 times if a request fails.
                        </li>
                        <li>
                            (2023-08-17) Previously newly entered data could be deleted after a failed sync; this has been
                            resolved.
                        </li>
                        <li>
                            (2023-08-17) We have improved the synchronisation message system: now the synchronizing message
                            will close only at the end of a sync and there are new animations on the message. The count of not
                            synced data will also show on top of the sync button.
                        </li>
                        <li>
                            (2023-08-07) It was hard to tell exactly how well a new roll-out of bahis-desk had been so we have
                            added the ability to track which version of the desktop app is being used in the field.
                        </li>
                        <li>(2023-06-23) We now how automated semantic versioning for an improved release cycle.</li>
                        <li>
                            (2023-05-25) The Geoinformation and Form Summary pages had no search feature and so were difficult
                            to use - we have added search features to both pages.
                        </li>
                        <li>(2023-03-29) Buitl and released bahis-dash v1!</li>
                        <li>
                            (2023-03-28) When users sign in from bahis-desk they used to have the entire branch catchment
                            returned to them but no upazila (which was later inferred from the whole catchment every time it
                            was needed); we now don&apos;t send the catchment (as users already have this) and do send the
                            upazila (so it no longer needs to be determined over and over again) - importantly this limits
                            login to accounts that have been correctly assigned as an upazila.
                        </li>
                        <li>
                            (2023-03-22) When forms were being updated, bahis-desk was not recognising this unless the parent
                            module was also updated. This has now been corrected.
                        </li>
                        <li>
                            (2023-03-21) Previously users were being asked to fill out mouza every time they filled out any
                            form; however, nobody was using this as union is enough granularity and so we have removed this
                            from all forms.
                        </li>
                        <li>
                            (2023-03-07) When synchronising new form submissions, clicking &quot;sync now&quot; twice in a row
                            was creating local duplications due to timestamp discrepancies. In this version, there will be no
                            duplicated entry as we always default to the version kept on the central server.
                        </li>
                        <li>
                            (2023-02-23) When editing a form that had been submitted but not synchronised, clicking
                            &quot;submit&quot; in the edit window was creating a local duplicate of that submission. In this
                            version, there will be no locally duplicated entries.
                        </li>
                        <li>
                            (2023-01-24) Previously there was no auto-fill for geolocations (division, district, and upazila),
                            the geolocation fields have been hidden from users, and now it is auto filling in the back.
                        </li>
                    </ul>
                </AccordionDetails>
            </Accordion>

            <Grid container>
                {menuModules &&
                    menuModules.map((menuItem) => (
                        <Grid
                            item
                            className={classes.menuGrid}
                            key={'menu-' + menuItem.id}
                            style={{ order: menuItem.sort_order }}
                            lg={3}
                            md={4}
                            sm={6}
                            xs={12}
                        >
                            {typeEvalutor(menuItem)}
                        </Grid>
                    ))}
            </Grid>
        </Container>
    );
};

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
    currentMenu: MenuItem | null;
    isBackPossible: boolean;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
    const result = {
        currentMenu: getCurrentMenu(state),
        isBackPossible: !isPrevMenuEmpty(state),
    };
    return result;
};

/** map props to actions */
const mapDispatchToProps = {
    setMenuItemActionCreator: setMenuItem,
    setPrevMenuActionCreator: setPrevMenu,
    resetMenuActionCreator: resetMenu,
};

/** connect clientsList to the redux store */
const ConnectedMenu = connect(mapStateToProps, mapDispatchToProps)(Menu);

export default withRouter(ConnectedMenu);
