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
import {
  CONTAINS_TYPE,
  ENDS_WITH_TYPE,
  EQUAL_TYPE,
  NOT_CONTAINS_TYPE,
  NOT_EQUAL_TYPE,
  STARTS_WITH_TYPE,
  TEXT_FILTER_OPERATORS,
} from './constants';

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
    const { filterItem, condition } = this.props;
    this.props.setFilterValueActionCreator(
      filterItem.name,
      [event.currentTarget.value],
      this.generateSqlText(filterItem, condition, [event.currentTarget.value])
    );
  };

  private handleConditionChange = (selectedOption: any) => {
    const { filterItem, value } = this.props;
    this.props.setConditionValueActionCreator(
      filterItem.name,
      selectedOption.value,
      this.generateSqlText(filterItem, selectedOption.value, value)
    );
  };

  /** generates the SQL where text relative to filter condition, value
   * @param {FilterTextItem} filterTextItem - the filter text item
   * @param {FilterCondition} condition - the filter condition
   * @param {FilterValue} value - the filter value
   * @returns {string} - the relevant WHERE SQL text
   */
  private generateSqlText = (
    filterItem: FilterTextItem,
    condition: FilterCondition,
    value: FilterValue
  ): string => {
    if (condition && value && value.length > 0 && value[0] !== '') {
      switch (condition) {
        case CONTAINS_TYPE:
          return `instr("${filterItem.name}", "${value[0]}") > 0`;
        case NOT_CONTAINS_TYPE:
          return `instr("${filterItem.name}", "${value[0]}") < 1`;
        case STARTS_WITH_TYPE:
          return `${filterItem.name} like "${value[0]}%"`;
        case ENDS_WITH_TYPE:
          return `${filterItem.name} like "%${value[0]}"`;
        case EQUAL_TYPE:
          return `${filterItem.name} = "${value[0]}"`;
        case NOT_EQUAL_TYPE:
          return `${filterItem.name} != "${value[0]}"`;
      }
    }
    return '';
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
