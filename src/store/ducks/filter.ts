import { AnyAction, Store } from 'redux';
import SeamlessImmutable from 'seamless-immutable';

/** The reducer name */
export const reducerName = 'filter';

export type FilterCondition = string | null;
export type FilterValue = string[] | null;

/** interface for filter value */
export interface FilterValueObj {
  condition: FilterCondition;
  value: FilterValue;
  sql: string;
}

// actions

/** action types */
export const SET_CONDITION_VALUE = 'bahis/reducer/filter/SET_CONDITION_VALUE';
export const SET_FILTER_VALUE = 'bahis/reducer/filter/SET_FILTER_VALUE';
export const RESET_FILTERS = 'bahis/reducer/filter/RESET_FILTERS';

/** interface for SET_CONDITION_VALUE action */
export interface SetConditionValueAction extends AnyAction {
  name: string;
  value: string | null;
  sql: string;
  type: typeof SET_CONDITION_VALUE;
}

/** interface for SET_FILTER_VALUE action */
export interface SetFilterValueAction extends AnyAction {
  name: string;
  value: string[] | null;
  sql: string;
  type: typeof SET_FILTER_VALUE;
}

/** interface for RESET_FILTERS action */
export interface ResetFiltersAction extends AnyAction {
  type: typeof RESET_FILTERS;
}

/** Create type for filter reducer actions */
export type FilterActionTypes =
  | SetConditionValueAction
  | SetFilterValueAction
  | ResetFiltersAction
  | AnyAction;

// action creators

/** set filter condition value action creator
 * @param {string } name - filter name where value will be added
 * @param {string | null} value - filter condition value to add store
 * @param {string} sql - sql condition text to add store
 * @return {SetConditionValueAction} - an action to add condition value to store
 */
export const setConditionValue = (
  name: string,
  value: string | null,
  sql: string
): SetConditionValueAction => ({
  name,
  sql,
  type: SET_CONDITION_VALUE,
  value,
});

/** set filter  value action creator
 * @param {string } name - filter name where value will be added
 * @param {string[] | null} value - filter value to add store
 * @param {string} sql - sql condition text to add store
 * @return {SetFilterValueAction} - an action to add filter value to store
 */
export const setFilterValue = (
  name: string,
  value: string[] | null,
  sql: string
): SetFilterValueAction => ({
  name,
  sql,
  type: SET_FILTER_VALUE,
  value,
});

/** reset the filter dux to initial state
 * @return {ResetFiltersAction} - an action to reset the state of the store
 */
export const resetFilters = (): ResetFiltersAction => ({
  type: RESET_FILTERS,
});

// The reducer
/** interface for filters values object */
export interface FiltersValueObj {
  [key: string]: FilterValueObj;
}

/** interface for filter state in redux store */
interface FilterState {
  filters: FiltersValueObj;
}

/** Create an immutable filter state */
export type ImmutableFilterState = SeamlessImmutable.ImmutableObject<FilterState>;

/** initial filter-state state */
const initialState: any = {
  filters: {},
};

/** the filter reducer function */
export default function reducer(
  state: any = initialState,
  action: FilterActionTypes
): ImmutableFilterState {
  let filters;
  switch (action.type) {
    case SET_CONDITION_VALUE:
      const value = state.getIn(['filters', action.name, 'value']) || null;
      filters = state.getIn(['filters']).asMutable({ deep: true });
      return SeamlessImmutable({
        ...state.asMutable({ deep: true }),
        filters: { ...filters, [action.name]: { value, condition: action.value, sql: action.sql } },
      });
    case SET_FILTER_VALUE:
      const condition = state.getIn(['filters', action.name, 'condition']) || null;
      filters = state.getIn(['filters']).asMutable({ deep: true });
      return SeamlessImmutable({
        ...state.asMutable({ deep: true }),
        filters: { ...filters, [action.name]: { condition, value: action.value, sql: action.sql } },
      });
    case RESET_FILTERS:
      return initialState;
    default:
      return state;
  }
}

// selectors

/** returns the filter object respect to the filter name
 * @param {Partial<Store>} state - the redux store
 * @param {string} name - the filter name
 * @return { FilterValueObj | null } - the filter Value obj respect to name
 */
export function getFilterValueObj(state: Partial<Store>, name: string): FilterValueObj | null {
  return (state as any)[reducerName].filters[name] || null;
}

/** returns the filter value respect to the filter name
 * @param {Partial<Store>} state - the redux store
 * @param {string} name - the filter name
 * @return { string[] | null } - the filter Value respect to name
 */
export function getFilterValue(state: Partial<Store>, name: string): string[] | null {
  if (name in (state as any)[reducerName].filters) {
    return (state as any)[reducerName].filters[name].value;
  }
  return null;
}

/** returns the filter condition respect to the filter name
 * @param {Partial<Store>} state - the redux store
 * @param {string} name - the filter name
 * @return { string | null } - the filter condition respect to name
 */
export function getFilterCondition(state: Partial<Store>, name: string): string | null {
  if (name in (state as any)[reducerName].filters) {
    return (state as any)[reducerName].filters[name].condition;
  }
  return null;
}

/** returns all the filter value objects
 * @param {Partial<Store>} state - the redux store
 * @return { {[key:string]:FilterValueObj} } - a dict containing all filter value objects
 */
export function getAllFilterValueObjs(state: Partial<Store>): { [key: string]: FilterValueObj } {
  return (state as any)[reducerName].filters;
}
