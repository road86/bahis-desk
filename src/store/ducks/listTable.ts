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
  orederSql: string;
}

// actions
/** action types */
export const SET_ORDER_VALUE = 'bahis/reducer/listTable/SET_ORDER_VALUE';

/** interface for SET_ORDER_VALUE action */
export interface SetOrderValueAction extends AnyAction {
  name: string;
  value: string | null;
  sql: string;
  type: typeof SET_ORDER_VALUE;
}

/** Create type for listTable reducer actions */
export type ListTableActionTypes = SetOrderValueAction | AnyAction;

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
  let columns;
  switch (action.type) {
    case SET_ORDER_VALUE:
      columns = state.getIn(['columns']).asMutable({ deep: true });
      return SeamlessImmutable({
        ...state.asMutable({ deep: true }),
        columns: { ...columns, [action.name]: { order: action.value, orderSql: action.sql } },
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
export function getColumnPropertyObj(
  state: Partial<Store>,
  name: string
): ColumnPropertyObj | null {
  return (state as any)[reducerName].columns[name] || null;
}
