import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { connect } from 'react-redux';
import { Store } from 'redux';
import { ColumnObj } from '..';
import { getOrderValue, OrderProperty, setOrderValue } from '../../../store/ducks/listTable';
import './OrderBy.css';

/** props interface for OrderBy component */
export interface OrderByProps {
  order: OrderProperty | null;
  setOrderValueActionCreator: typeof setOrderValue;
  colDefifinitionObj: ColumnObj;
  appLanguage: string;
}

class OrderBy extends React.Component<OrderByProps> {
  public render() {
    const { order, colDefifinitionObj, appLanguage } = this.props;
    if (colDefifinitionObj.sortable) {
      return (
        <div className="sortable-column" onClick={this.onClickHandler}>
          {colDefifinitionObj.label[appLanguage]}{' '}
          {order &&
            (order === 'ASC' ? (
              <FontAwesomeIcon icon={['fas', 'long-arrow-alt-up']} />
            ) : (
              <FontAwesomeIcon icon={['fas', 'long-arrow-alt-down']} />
            ))}
          {!order && <FontAwesomeIcon icon={['fas', 'sort']} />}
        </div>
      );
    } else {
      return <div>{colDefifinitionObj.label[appLanguage]}</div>;
    }
  }

  // tslint:disable-next-line: variable-name
  private onClickHandler = (_event: React.MouseEvent<HTMLDivElement>) => {
    const { colDefifinitionObj, order } = this.props;
    if (order && order === 'ASC') {
      this.props.setOrderValueActionCreator(
        colDefifinitionObj.field_name,
        'DESC',
        `${colDefifinitionObj.field_name} DESC`
      );
    } else {
      this.props.setOrderValueActionCreator(
        colDefifinitionObj.field_name,
        'ASC',
        `${colDefifinitionObj.field_name} ASC`
      );
    }
  };
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
