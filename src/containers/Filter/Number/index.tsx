import * as React from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import { FormGroup, Input, Label } from 'reactstrap';
import { Store } from 'redux';
import { FilterItem } from '..';
import {
  FilterCondition,
  FilterValue,
  getFilterCondition,
  getFilterValue,
  setConditionValue,
  setFilterValue,
} from '../../../store/ducks/filter';
import { FILTER_NUMBER_TYPE } from '../constants';
import { NUMBER_FILTER_OPERATORS } from './constants';

export interface FilterNumberItem extends FilterItem {
  type: FILTER_NUMBER_TYPE;
}

export interface NumberProps {
  filterItem: FilterNumberItem;
  value: FilterValue;
  condition: FilterCondition;
  setConditionValueActionCreator: typeof setConditionValue;
  setFilterValueActionCreator: typeof setFilterValue;
}

class FilterNumber extends React.Component<NumberProps> {
  public render() {
    const { filterItem } = this.props;
    return (
      <FormGroup>
        <Label>Number</Label>
        <Select options={NUMBER_FILTER_OPERATORS} onChange={this.handleConditionChange} />
        <Input type="number" name={filterItem.name} onChange={this.handleValueChange} />
      </FormGroup>
    );
  }

  private handleValueChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { filterItem } = this.props;
    this.props.setFilterValueActionCreator(filterItem.name, [event.currentTarget.value]);
  };

  private handleConditionChange = (selectedOption: any) => {
    const { filterItem } = this.props;
    this.props.setConditionValueActionCreator(filterItem.name, selectedOption.value);
  };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  value: FilterValue;
  condition: FilterCondition;
}

/** Interface to describe props from parent */
interface ParentProps {
  filterItem: FilterNumberItem;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>, parentProps: ParentProps): DispatchedStateProps => {
  const { filterItem } = parentProps;
  const result = {
    condition: getFilterCondition(state, filterItem.name),
    value: getFilterValue(state, filterItem.name),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  setConditionValueActionCreator: setConditionValue,
  setFilterValueActionCreator: setFilterValue,
};

/** connect clientsList to the redux store */
const ConnectedFilterNumber = connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterNumber);

export default ConnectedFilterNumber;
