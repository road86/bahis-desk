import { AnyAction, Store } from 'redux';
import SeamlessImmutable from 'seamless-immutable';

/** The reducer name */
export const reducerName = 'listTable';

export type OrderAscProperty = 'ASC';
export type OrderDescProperty = 'DESC';
export type OrderProperty = OrderAscProperty | OrderDescProperty;

/** interface for column value */
export interface ColumnPropertyObj {
    order: OrderProperty;
    orderSql: string;
}

// actions
/** action types */
export const SET_ORDER_VALUE = 'bahis/reducer/listTable/SET_ORDER_VALUE';
export const RESET_LIST_TABLE = 'bahis/reducer/listTable/RESET_COLUMNS';
export const SET_PAGE_SIZE = 'bahis/reducer/listTable/SET_PAGE_SIZE';
export const SET_PAGE_NUMBER = 'bahis/reducer/listTable/SET_PAGE_NUMBER';
export const SET_TOTAL_RECORDS = 'bahis/reducer/listTable/SET_TOTAL_RECORDS';

/** interface for SET_ORDER_VALUE action */
export interface SetOrderValueAction extends AnyAction {
    name: string;
    value: string | null;
    sql: string;
    type: typeof SET_ORDER_VALUE;
}

/** interface for RESET_COLUMNS action */
export interface ResetListTableAction extends AnyAction {
    type: typeof RESET_LIST_TABLE;
}

/** interface for SET_PAGE_SIZE action */
export interface SetPageSizeAction extends AnyAction {
    pageSize: number;
    type: typeof SET_PAGE_SIZE;
}

/** interface for SET_PAGE_NUMBER action */
export interface SetPageNumberAction extends AnyAction {
    pageNumber: number;
    type: typeof SET_PAGE_NUMBER;
}

/** interface for SET_TOTAL_RECORDS action */
export interface SetTotalRecordsAction extends AnyAction {
    totalRecords: number;
    type: typeof SET_TOTAL_RECORDS;
}

/** Create type for listTable reducer actions */
export type ListTableActionTypes =
    | SetOrderValueAction
    | ResetListTableAction
    | SetPageSizeAction
    | SetPageNumberAction
    | SetTotalRecordsAction
    | AnyAction;

// action creators

/** set order value action creator
 * @param {string} name - column name where order property will be set
 * @param {OrderProperty} value - order value to set
 * @param {string} sql - the sql string related to order property
 * @returns {SetOrderValueAction} - an action to set order value in store
 */
export const setOrderValue = (name: string, value: OrderProperty, sql: string): SetOrderValueAction => ({
    name,
    sql,
    type: SET_ORDER_VALUE,
    value,
});

/** reset the listTable dux to initial state
 * @return {ResetListTableAction} - an action to reset the state of the store
 */
export const resetListTable = (): ResetListTableAction => ({
    type: RESET_LIST_TABLE,
});

/** sets the page size of listTable dux
 * @param {number} pageSize - the pagination size to set
 * @returns {SetPageSize} - an action to set page size in store
 */
export const setPageSize = (pageSize: number): SetPageSizeAction => ({
    pageSize,
    type: SET_PAGE_SIZE,
});

/** sets the page number of listTable dux
 * @param {number} pageNumber - the page number to set
 * @returns {SetPageNumberAction} - an action to set page number in store
 */
export const setPageNumber = (pageNumber: number): SetPageNumberAction => ({
    pageNumber,
    type: SET_PAGE_NUMBER,
});

/** sets the total records of listTable dux
 * @param {number} totalRecords - the totalRecords value to set
 * @returns {SetTotalRecordsAction} - an action to set total records in store
 */
export const setTotalRecords = (totalRecords: number): SetTotalRecordsAction => ({
    totalRecords,
    type: SET_TOTAL_RECORDS,
});

// the reducer
/** interface for columns value object */
export interface ColumnsValueObj {
    [key: string]: ColumnPropertyObj;
}

/** interface for listTable state in redux store */
interface ListTableState {
    columns: ColumnsValueObj;
    pageNumber: number; // page number
    pageSize: number; // pagination size
    totalRecords: number;
}

/** Create an immutable listTable state */
export type ImmutableListTableState = SeamlessImmutable.ImmutableObject<ListTableState>;

/** initial listTable-state state */
const initialState: any = {
    columns: {},
    pageNumber: 0,
    pageSize: 1,
    totalRecords: 0,
};

/** the listTable reducer function */
export default function reducer(state: any = initialState, action: ListTableActionTypes): any {
    switch (action.type) {
        case SET_ORDER_VALUE:
            return SeamlessImmutable({
                // ...state.asMutable({ deep: true }),
                ...SeamlessImmutable.asMutable(state, { deep: true }),
                columns: {
                    [action.name]: { order: action.value, orderSql: action.sql },
                },
            });
        case RESET_LIST_TABLE:
            return initialState;
        case SET_PAGE_SIZE:
            return SeamlessImmutable({
                // ...state.asMutable({ deep: true }),
                ...SeamlessImmutable.asMutable(state, { deep: true }),
                pageSize: action.pageSize,
            });
        case SET_PAGE_NUMBER:
            return SeamlessImmutable({
                // ...state.asMutable({ deep: true }),
                ...SeamlessImmutable.asMutable(state, { deep: true }),
                pageNumber: action.pageNumber,
            });
        case SET_TOTAL_RECORDS:
            return SeamlessImmutable({
                // ...state.asMutable({ deep: true }),
                ...SeamlessImmutable.asMutable(state, { deep: true }),
                totalRecords: action.totalRecords,
            });
        default:
            return state;
    }
}

// selectors

/** returns the column property object respect to the column name
 * @param {Partial<Store>} state - the redux store
 * @param {string} name - the column name
 * @return { ColumnPropertyObj | null } - the column property obj respect to name
 */
export function getColumnPropertyObj(state: Partial<Store>, name: string): ColumnPropertyObj | null {
    return (state as any)[reducerName].columns[name] || null;
}

/** returns the order value respect to the column name
 * @param {Partial<Store>} state - the redux store
 * @param {string} name - the column name
 * @return { OrderProperty | null } - the order value respect to column name; otherwise, null
 */
export function getOrderValue(state: Partial<Store>, name: string): OrderProperty | null {
    if (name in (state as any)[reducerName].columns) {
        return (state as any)[reducerName].columns[name].order;
    }
    return null;
}

/** returns all the column value objects
 * @param {Partial<Store>} state - the redux store
 * @return {ColumnsValueObj} - a dict containing all column value objects
 */
export function getAllColumnsValueObj(state: Partial<Store>): ColumnsValueObj {
    return (state as any)[reducerName].columns;
}

/** returns the page size
 * @param {Partial<Store>} state - the redux store
 * @return {number} - the page size value stored in store
 */
export function getPageSize(state: Partial<Store>): number {
    return (state as any)[reducerName].pageSize;
}

/** returns the page number
 * @param {Partial<Store>} state - the redux store
 * @return {number} - the page number value stored in store
 */
export function getPageNumber(state: Partial<Store>): number {
    return (state as any)[reducerName].pageNumber;
}

/** returns the total records
 * @param {Partial<Store>} state - the redux store
 * @return {number} - the total records value stored in store
 */
export function getTotalRecords(state: Partial<Store>): number {
    return (state as any)[reducerName].totalRecords;
}
