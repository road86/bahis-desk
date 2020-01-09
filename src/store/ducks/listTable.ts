import { AnyAction } from 'redux';
import SeamlessImmutable from 'seamless-immutable';

/** The reducer name */
export const reducerName = 'listTable';

export type ORDER_ASC_PROPERTY = 'ASC';
export type ORDER_DESC_PROPERTY = 'DESC';
export type ORDER_PROPERTY = ORDER_ASC_PROPERTY | ORDER_DESC_PROPERTY;

/** interface for column value */
export interface ColumnPropertyObj {
  order: ORDER_PROPERTY;
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
 * @param {ORDER_PROPERTY} value - order value to set
 * @param {string} sql - the sql string related to order property
 * @returns {SetOrderValueAction} - an action to set order value in store
 */
export const setOrderValue = (
  name: string,
  value: ORDER_PROPERTY,
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
