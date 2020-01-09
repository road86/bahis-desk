import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { connect } from 'react-redux';
import { Store } from 'redux';
import { ColumnObj } from '..';
import { getOrderValue, OrderProperty, setOrderValue } from '../../../store/ducks/listTable';

/** props interface for OrderBy component */
export interface OrderByProps {
  order: OrderProperty | null;
  setOrderValueActionCreator: typeof setOrderValue;
  colDefifinitionObj: ColumnObj;
}

class OrderBy extends React.Component {
  public render() {
    return <FontAwesomeIcon icon={['fas', 'arrow-up']} />;
  }
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  order: OrderProperty | null;
}

/** Interface to describe props from parent */
interface ParentProps {
  colDefifinitionObj: ColumnObj;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>, parentProps: ParentProps): DispatchedStateProps => {
  const result = {
    order: getOrderValue(state, parentProps.colDefifinitionObj.field_name),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  setOrderValueActionCreator: setOrderValue,
};

/** connect OrderBy to the redux store */
const ConnectedOrderBy = connect(
  mapStateToProps,
  mapDispatchToProps
)(OrderBy);

export default ConnectedOrderBy;
