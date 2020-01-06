import * as React from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import { Col, FormGroup, Label, Row } from 'reactstrap';
import { Store } from 'redux';
import { FilterItem } from '..';
import { getNativeLanguageText } from '../../../helpers/utils';
import {
  FilterCondition,
  FilterValue,
  getFilterCondition,
  getFilterValue,
  setConditionValue,
  setFilterValue,
} from '../../../store/ducks/filter';
import { FILTER_SINGLE_SELECT_TYPE } from '../constants';

export interface FilterSingleSelectItem extends FilterItem {
  type: FILTER_SINGLE_SELECT_TYPE;
}

export interface SingleSelectProps {
  filterItem: FilterSingleSelectItem;
  value: FilterValue;
  condition: FilterCondition;
  setConditionValueActionCreator: typeof setConditionValue;
  setFilterValueActionCreator: typeof setFilterValue;
  appLanguage: string;
}

export interface SingleSelectState {
  filterOptions: Array<{ label: string; value: string }>;
  filterDataset: any[];
}

class FilterSingleSelect extends React.Component<SingleSelectProps, SingleSelectState> {
  public state = { filterOptions: [], filterDataset: [] };
  public render() {
    const { filterItem, appLanguage, value } = this.props;
    const { filterOptions } = this.state;
    return (
      <FormGroup>
        <Row>
          <Col md={3}>
            <Label>{getNativeLanguageText(filterItem.label, appLanguage)}</Label>
          </Col>
          <Col md={3} />
          <Col md={6}>
            <Select
              options={filterOptions}
              value={filterOptions.filter((filterObj: any) => filterObj.value === value)}
              onChange={this.handleValueChange}
            />
          </Col>
        </Row>
      </FormGroup>
    );
  }

  private handleValueChange = (selectedOption: any) => {
    const { filterItem, condition } = this.props;
    this.props.setFilterValueActionCreator(
      filterItem.name,
      [selectedOption.value],
      this.generateSqlText(filterItem, condition, [selectedOption.value])
    );
  };

  /** generates the SQL where text relative to filter condition, value
   * @param {FilterTextItem} filterItem - the filter text item
   * @param {FilterCondition} condition - the filter condition
   * @param {FilterValue} value - the filter value
   * @returns {string} - the relevant WHERE SQL text
   */
  private generateSqlText = (
    filterItem: FilterSingleSelectItem,
    condition: FilterCondition,
    value: FilterValue
  ): string => {
    if (condition && value && value.length > 0 && value[0] !== '') {
      return `${filterItem.name} = "${value[0]}"`;
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
  filterItem: FilterSingleSelectItem;
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

/** connect FilterSingleSelect to the redux store */
const ConnectedFilterSingleSelect = connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterSingleSelect);

export default ConnectedFilterSingleSelect;
