import * as React from 'react';
// import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
import { FILTER_DATE_TYPE } from '../constants';
import { DATE_FILTER_OPERATORS, IN_BETWEEN_TYPE } from './constants';

export interface FilterDateItem extends FilterItem {
  type: FILTER_DATE_TYPE;
}

export interface DateProps {
  filterItem: FilterDateItem;
  value: FilterValue;
  condition: FilterCondition;
  setConditionValueActionCreator: typeof setConditionValue;
  setFilterValueActionCreator: typeof setFilterValue;
}

class FilterDate extends React.Component<DateProps> {
  public render() {
    const { filterItem, condition, value } = this.props;
    if (condition !== IN_BETWEEN_TYPE && value && value.length > 1) {
      this.props.setFilterValueActionCreator(filterItem.name, [value[0]]);
    }
    // const startDate = new Date();
    return (
      <FormGroup>
        <Label>Number</Label>
        <Select options={DATE_FILTER_OPERATORS} onChange={this.handleConditionChange} />
        {/* <DatePicker selected={startDate} onChange={this.handleConditionChange} /> */}
        <Input type="number" name={filterItem.name} onChange={this.handleValueChange} />
        {condition === IN_BETWEEN_TYPE && <span>and</span>}
        {condition === IN_BETWEEN_TYPE && (
          <Input type="number" name={filterItem.name + '_v2'} onChange={this.handleValueChange} />
        )}
      </FormGroup>
    );
  }

  private handleValueChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { filterItem, value } = this.props;
    let tmpVal;
    if (event.currentTarget.name === filterItem.name + '_v2') {
      tmpVal = [value && value[0] ? value[0] : '', event.currentTarget.value];
    } else {
      tmpVal =
        value && value[1] ? [event.currentTarget.value, value[1]] : [event.currentTarget.value];
    }
    this.props.setFilterValueActionCreator(filterItem.name, tmpVal);
  };

  private handleConditionChange = (selectedOption: any) => {
    const { filterItem } = this.props;
    this.props.setConditionValueActionCreator(filterItem.name, selectedOption);
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
  filterItem: FilterDateItem;
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
const ConnectedFilterDate = connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterDate);

export default ConnectedFilterDate;
