import { AnyAction, Store } from 'redux';
import SeamlessImmutable from 'seamless-immutable';

/** The reducer name */
export const reducerName = 'menu';

/** Types of Menu Items */
export const FORM_TYPE = 'form';
export type FORM_TYPE = typeof FORM_TYPE;
export const LIST_TYPE = 'list';
export type LIST_TYPE = typeof LIST_TYPE;
export const MODULE_TYPE = 'container';
export type MODULE_TYPE = typeof MODULE_TYPE;
export const FORMLIST_TYPE = 'form_list';
export type FORMLIST_TYPE = typeof FORMLIST_TYPE;
export const IFRAME_TYPE = 'iframe';
export type IFRAME_TYPE = typeof IFRAME_TYPE;

/** menu item types as enum */
export enum MenuItemTypes {
    form = 1,
    list,
    module,
    iframe,
    submitted,
}

/** interface for multi language label object */
export interface Label {
    [key: string]: string;
}

/** interface for MenuItems */
export interface MenuItem {
    id: number;
    title: string;
    icon: string;
    description: string | null;
    sort_order: number;
    parent_module: number;
    module_type: MenuItemTypes;
    form: number | null;
    external_url: string | null;
}

// actions

/** SET_MENU_ITEM action type */
export const SET_MENU_ITEM = 'opensrp/reducer/menu/SET_MENU_ITEM';
export const SET_PREV_MENU = 'opensrp/reducer/menu/SET_PREV_MENU';
export const RESET_MENU = 'opensrp/reducer/menu/RESET_MENU';

/** interface for SET_MENU_ITEM action */
export interface SetMenuItemAction extends AnyAction {
    menuItem: MenuItem;
    type: typeof SET_MENU_ITEM;
}

/** interface for SET_PREV_MENU action */
export interface SetPrevMenuAction extends AnyAction {
    type: typeof SET_PREV_MENU;
}

/** interface for SET_PREV_MENU action */
export interface ResetMenuAction extends AnyAction {
    type: typeof RESET_MENU;
}

/** Create type for menu reducer actions */
export type MenuActionTypes = SetMenuItemAction | SetPrevMenuAction | ResetMenuAction | AnyAction;

// action creators

/** set menu item action creator
 * @param {ModuleMenu | FormMenu | ListMenu} menuItem - menuItem add to store
 * @return {SetMenuItemAction} - an action to add menuItem to store
 */
export const setMenuItem = (menuItem: MenuItem): SetMenuItemAction => ({
    menuItem,
    type: SET_MENU_ITEM,
});

/** set prev menu action creator
 * @return {SetPrevMenuAction} - an action to set prev menu
 */
export const setPrevMenu = (): SetPrevMenuAction => ({
    type: SET_PREV_MENU,
});

export const resetMenu = (): ResetMenuAction => ({
    type: RESET_MENU,
});

// The reducer

/** interface for menu state in redux store */
interface MenuState {
    currentMenu: MenuItem | null;
    prevMenu: MenuItem[];
}

/** Create an immutable menu state */
export type ImmutableMenuState = SeamlessImmutable.ImmutableObject<MenuState>;

/** initial menu-state state */
const initialState: ImmutableMenuState = SeamlessImmutable({
    currentMenu: null,
    prevMenu: [],
});

/** the menu reducer function */
export default function reducer(state: ImmutableMenuState = initialState, action: MenuActionTypes): ImmutableMenuState {
    let prev: any;
    let tmpPrev: any;
    switch (action.type) {
        case SET_MENU_ITEM:
            prev = state.getIn(['currentMenu']);
            return SeamlessImmutable({
                ...state,
                currentMenu: action.menuItem,
                prevMenu: prev ? state.prevMenu.concat(prev) : state.prevMenu,
            });
        case SET_PREV_MENU:
            tmpPrev = state.getIn(['prevMenu']);
            if (tmpPrev.length > 0) {
                return SeamlessImmutable({
                    ...state,
                    currentMenu: tmpPrev.slice(-1)[0],
                    prevMenu: tmpPrev.slice(0, tmpPrev.length - 1),
                });
            }
            return state;
        case RESET_MENU:
            return initialState;
        default:
            return state;
    }
}

// selectors

/** returns the current menu item
 * @param {Partial<Store>} state - the redux store
 * @return { MenuItem } - the current Menu Item
 */
export function getCurrentMenu(state: Partial<Store>): MenuItem | null {
    return (state as any)[reducerName].currentMenu;
}

/** checks the prevMenu of the store
 * @param {Partial<Store>} state - the redux store
 * @return { boolean } - returns true if empty; otherwise false
 */
export function isPrevMenuEmpty(state: Partial<Store>): boolean {
    return (state as any)[reducerName].prevMenu.length ? false : true;
}
