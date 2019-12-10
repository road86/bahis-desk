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
import { FILTER_TEXT_TYPE } from '../constants';
import { TEXT_FILTER_OPERATORS } from './constants';

export interface FilterTextItem extends FilterItem {
  type: FILTER_TEXT_TYPE;
}

export interface TextProps {
  filterItem: FilterTextItem;
  value: FilterValue;
  condition: FilterCondition;
  setConditionValueActionCreator: typeof setConditionValue;
  setFilterValueActionCreator: typeof setFilterValue;
}

class FilterText extends React.Component<TextProps> {
  public render() {
    const { filterItem } = this.props;
    return (
      <FormGroup>
        <Label>Text</Label>
        <Select options={TEXT_FILTER_OPERATORS} onChange={this.handleConditionChange} />
        <Input type="text" name={filterItem.name} onChange={this.handleValueChange} />
      </FormGroup>
    );
  }

  private handleValueChange = (event: React.FormEvent<HTMLInputElement>) => {
    const { filterItem } = this.props;
    this.props.setFilterValueActionCreator(filterItem.name, [event.currentTarget.value], '');
  };

  private handleConditionChange = (selectedOption: any) => {
    const { filterItem } = this.props;
    this.props.setConditionValueActionCreator(filterItem.name, selectedOption.value, '');
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
  filterItem: FilterTextItem;
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
const ConnectedFilterText = connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterText);

export default ConnectedFilterText;
