import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { OrderProperty } from '../../../store/ducks/listTable';

/** props interface for OrderBy component */
export interface OrderByProps {
  order: OrderProperty;
  setOrderValueActionCreator: any;
}

class OrderBy extends React.Component {
  public render() {
    return <FontAwesomeIcon icon={['fas', 'arrow-up']} />;
  }
}

export default OrderBy;
