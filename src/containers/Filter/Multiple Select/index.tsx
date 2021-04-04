import lodash from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import { Col, FormGroup, Label, Row } from 'reactstrap';
import { Store } from 'redux';
import { FilterItem } from '..';
import { getNativeLanguageText } from '../../../helpers/utils';
import { ipcRenderer } from '../../../services/ipcRenderer';
import {
  FilterCondition,
  FiltersValueObj,
  FilterValue,
  getAllFilterValueObjs,
  getFilterCondition,
  getFilterValue,
  setConditionValue,
  setFilterValue,
} from '../../../store/ducks/filter';
import { FILTER_MULTIPLE_SELECT_TYPE } from '../constants';

export interface FilterMultipleSelectItem extends FilterItem {
  type: FILTER_MULTIPLE_SELECT_TYPE;
}

export interface MultipleSelectProps {
  filterItem: FilterMultipleSelectItem;
  value: FilterValue;
  condition: FilterCondition;
  setConditionValueActionCreator: typeof setConditionValue;
  setFilterValueActionCreator: typeof setFilterValue;
  appLanguage: string;
  listId: string;
  filtersValueObj: FiltersValueObj;
}

export interface FilterOption {
  label: string;
  value: string;
}
export type FilterOptions = FilterOption[];
export type FilterDataset = any[];

export interface MultipleSelectState {
  filterOptions: FilterOptions;
  filterDataset: FilterDataset;
}

class FilterMultipleSelect extends React.Component<MultipleSelectProps, MultipleSelectState> {
  public state = { filterOptions: [], filterDataset: [] };

  public async componentDidMount() {
    const { filterItem, filtersValueObj, listId } = this.props;
    let dependency = filterItem.dependency
      ? typeof filterItem.dependency === 'string'
        ? [filterItem.dependency]
        : filterItem.dependency
      : [];
    dependency = [...dependency, filterItem.name];
    const response = await ipcRenderer.sendSync('fetch-filter-dataset', listId, dependency);
    const options = this.fetchOptionsFromDataset(filterItem, response, filtersValueObj);
    this.setState({ ...this.state, filterDataset: response, filterOptions: options });
  }

  public componentDidUpdate() {
    const { filterItem, filtersValueObj, value } = this.props;
    const { filterOptions, filterDataset } = this.state;
    const options = this.fetchOptionsFromDataset(filterItem, filterDataset, filtersValueObj);
    if (JSON.stringify(options) !== JSON.stringify(filterOptions)) {
      const optionValues = options.map((option: FilterOption) => option.value);
      const newValues = (value || []).filter(
        (valueItem) => valueItem && valueItem !== '' && optionValues.includes(valueItem),
      );
      this.props.setFilterValueActionCreator(
        filterItem.name,
        newValues,
        this.generateSqlText(filterItem, 'multiple select', newValues),
      );
      this.setState({ ...this.state, filterOptions: options });
    }
  }

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
              isMulti={true}
              options={filterOptions}
              value={filterOptions.filter((filterObj: any) => value && (value as any[]).includes(filterObj.value))}
              onChange={this.handleValueChange}
            />
          </Col>
        </Row>
      </FormGroup>
    );
  }

  private handleValueChange = (selectedOptions: any) => {
    const { filterItem } = this.props;
    const selectedValues = (selectedOptions || [])
      .map((item: FilterOption) => item.value)
      .filter((item: any) => item && item !== '');
    this.props.setFilterValueActionCreator(
      filterItem.name,
      selectedValues,
      this.generateSqlText(filterItem, 'multiple select', selectedValues),
    );
  };

  /** generates the SQL where text relative to filter condition, value
   * @param {FilterMultipleSelectItem} filterItem - the filter text item
   * @param {FilterCondition} condition - the filter condition
   * @param {FilterValue} value - the filter value
   * @returns {string} - the relevant WHERE SQL text
   */
  private generateSqlText = (
    filterItem: FilterMultipleSelectItem,
    condition: FilterCondition,
    value: FilterValue,
  ): string => {
    if (condition && value && value.length > 0) {
      return `${filterItem.name} in ("${value
        .filter((item) => item && item !== '')
        .toString()
        .replace(',', '","')}")`;
    }
    return '';
  };

  private fetchOptionsFromDataset = (
    filterItem: FilterItem,
    filterDataset: FilterDataset,
    filtersValueObj: FiltersValueObj,
  ): FilterOptions => {
    const options: FilterOptions = [];
    const filterItems = lodash.filter(filterDataset, (row) => {
      const dependency = filterItem.dependency
        ? typeof filterItem.dependency === 'string'
          ? [filterItem.dependency]
          : filterItem.dependency
        : [];
      if (dependency && dependency.length > 0) {
        let flag = true;
        dependency.forEach((conditionKey) => {
          flag =
            flag &&
            filtersValueObj[conditionKey] &&
            filtersValueObj[conditionKey].value &&
            row[conditionKey] &&
            (filtersValueObj[conditionKey].value as string[]).includes(row[conditionKey] as string);
        });
        return flag;
      }
      return true;
    });
    filterItems.forEach((item) => {
      if (filterItem.name in item) {
        options.push({ label: item[filterItem.name], value: item[filterItem.name] });
      }
    });
    return options;
  };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  value: FilterValue;
  condition: FilterCondition;
  filtersValueObj: FiltersValueObj;
}

/** Interface to describe props from parent */
interface ParentProps {
  filterItem: FilterMultipleSelectItem;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>, parentProps: ParentProps): DispatchedStateProps => {
  const { filterItem } = parentProps;
  const result = {
    condition: getFilterCondition(state, filterItem.name),
    filtersValueObj: getAllFilterValueObjs(state),
    value: getFilterValue(state, filterItem.name),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  setConditionValueActionCreator: setConditionValue,
  setFilterValueActionCreator: setFilterValue,
};

/** connect FilterMultipleSelect to the redux store */
const ConnectedFilterMultipleSelect = connect(mapStateToProps, mapDispatchToProps)(FilterMultipleSelect);

export default ConnectedFilterMultipleSelect;
