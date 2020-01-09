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

/** Create type for listTable reducer actions */
export type ListTableActionTypes = SetOrderValueAction | ResetListTableAction | AnyAction;

// action creators

/** set order value action creator
 * @param {string} name - column name where order property will be set
 * @param {OrderProperty} value - order value to set
 * @param {string} sql - the sql string related to order property
 * @returns {SetOrderValueAction} - an action to set order value in store
 */
export const setOrderValue = (
  name: string,
  value: OrderProperty,
  sql: string
): SetOrderValueAction => ({
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

// the reducer
/** interface for columns value object */
export interface ColumnsValueObj {
  [key: string]: ColumnPropertyObj;
}

/** interface for listTable state in redux store */
interface ListTableState {
  columns: ColumnsValueObj;
}

/** Create an immutable listTable state */
export type ImmutableListTableState = SeamlessImmutable.ImmutableObject<ListTableState>;

/** initial listTable-state state */
const initialState: ImmutableListTableState = SeamlessImmutable({
  columns: {},
});

/** the listTable reducer function */
export default function reducer(
  state: ImmutableListTableState = initialState,
  action: ListTableActionTypes
): ImmutableListTableState {
  switch (action.type) {
    case SET_ORDER_VALUE:
      return SeamlessImmutable({
        ...state.asMutable({ deep: true }),
        columns: {
          [action.name]: { order: action.value, orderSql: action.sql },
        },
      });
    case RESET_LIST_TABLE:
      return initialState;
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
export function getColumnPropertyObj(
  state: Partial<Store>,
  name: string
): ColumnPropertyObj | null {
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
 * @return { {ColumnsValueObj} } - a dict containing all column value objects
 */
export function getAllColumnsValueObj(state: Partial<Store>): ColumnsValueObj {
  return (state as any)[reducerName].columns;
}
