import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import { Store } from 'redux';
import filterReducer, {
  getAllFilterValueObjs,
  reducerName as filterReducerName,
  resetFilters,
} from '../../store/ducks/filter';
import {
  FILTER_DATE_TYPE,
  FILTER_MULTIPLE_SELECT_TYPE,
  FILTER_NUMBER_TYPE,
  FILTER_SINGLE_SELECT_TYPE,
  FILTER_TEXT_TYPE,
} from './constants';
import FilterDate, { FilterDateItem } from './Date';
import './Filter.css';
import FilterMultipleSelect, { FilterMultipleSelectItem } from './Multiple Select';
import FilterNumber, { FilterNumberItem } from './Number';
import FilterSingleSelect, { FilterSingleSelectItem } from './Single Select';
import FilterText, { FilterTextItem } from './Text';

interface LabelObj {
  [key: string]: string;
}

export interface FilterItem {
  type: string;
  label: LabelObj;
  name: string;
  dependency: string[];
}

interface OptionValue {
  name: string;
  [key: string]: string;
}
interface ChoiceItems {
  [key: string]: OptionValue[];
}

interface FilterProps {
  definition: FilterItem[];
  choices: ChoiceItems;
  filterValue: any;
  onSubmitHandler: any;
  resetFiltersActionCreator: typeof resetFilters;
  appLanguage: string;
  listId: string;
}

interface FilterState {
  isEnvSet: boolean;
}

/** register the filter reducer */
reducerRegistry.register(filterReducerName, filterReducer);

class Filter extends React.Component<FilterProps, FilterState> {
  public state = { isEnvSet: false };
  public componentDidMount() {
    this.props.resetFiltersActionCreator();
    this.setState({ ...this.state, isEnvSet: true });
  }

  public render() {
    const { definition, appLanguage, listId } = this.props;
    const { isEnvSet } = this.state;
    return (
      <div className="filter-container">
        {isEnvSet &&
          definition.map((filterItem, index) =>
            this.renderTypeEvaluator(filterItem, index, appLanguage, listId)
          )}
        <Button color="success" size="sm" onClick={this.filterHandler}>
          Submit
        </Button>
        <Button
          className="reset-button"
          color="secondary"
          size="sm"
          onClick={this.resetFilterHandler}
        >
          Reset
        </Button>
      </div>
    );
  }

  private renderTypeEvaluator = (
    filterItem: FilterItem,
    filterIndex: number,
    appLanguage: string,
    listId: string
  ) => {
    switch (filterItem.type) {
      case FILTER_TEXT_TYPE: {
        return (
          <FilterText
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterTextItem}
            appLanguage={appLanguage}
          />
        );
      }
      case FILTER_NUMBER_TYPE: {
        return (
          <FilterNumber
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterNumberItem}
            appLanguage={appLanguage}
          />
        );
      }
      case FILTER_DATE_TYPE: {
        return (
          <FilterDate
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterDateItem}
            appLanguage={appLanguage}
          />
        );
      }
      case FILTER_SINGLE_SELECT_TYPE: {
        return (
          <FilterSingleSelect
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterSingleSelectItem}
            appLanguage={appLanguage}
            listId={listId}
          />
        );
      }
      case FILTER_MULTIPLE_SELECT_TYPE: {
        return (
          <FilterMultipleSelect
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterMultipleSelectItem}
            appLanguage={appLanguage}
            listId={listId}
          />
        );
      }
      default:
        return null;
    }
  };

  // tslint:disable-next-line: variable-name
  private filterHandler = (_event: React.MouseEvent<Button>) => {
    this.props.onSubmitHandler(this.props.filterValue);
  };

  // tslint:disable-next-line: variable-name
  private resetFilterHandler = (_event: React.MouseEvent<Button>) => {
    this.props.resetFiltersActionCreator();
    this.props.onSubmitHandler({});
  };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  filterValue: any;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const result = {
    filterValue: getAllFilterValueObjs(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  resetFiltersActionCreator: resetFilters,
};

/** connect clientsList to the redux store */
const ConnectedFilter = connect(
  mapStateToProps,
  mapDispatchToProps
)(Filter);

export default ConnectedFilter;
