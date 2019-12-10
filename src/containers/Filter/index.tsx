import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Store } from 'redux';
import filterReducer, {
  getAllFilterValueObjs,
  reducerName as filterReducerName,
} from '../../store/ducks/filter';
import { FILTER_DATE_TYPE, FILTER_NUMBER_TYPE, FILTER_TEXT_TYPE } from './constants';
import FilterDate, { FilterDateItem } from './Date';
import FilterNumber, { FilterNumberItem } from './Number';
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
  filterHandler: any;
}

/** register the filter reducer */
reducerRegistry.register(filterReducerName, filterReducer);

class Filter extends React.Component<FilterProps> {
  public render() {
    const { definition } = this.props;
    return (
      <div>
        {definition.map((filterItem, index) => this.renderTypeEvaluator(filterItem, index))}
      </div>
    );
  }

  private renderTypeEvaluator = (filterItem: FilterItem, filterIndex: number) => {
    switch (filterItem.type) {
      case FILTER_TEXT_TYPE: {
        return (
          <FilterText key={'filter-' + filterIndex} filterItem={filterItem as FilterTextItem} />
        );
      }
      case FILTER_NUMBER_TYPE: {
        return (
          <FilterNumber key={'filter-' + filterIndex} filterItem={filterItem as FilterNumberItem} />
        );
      }
      case FILTER_DATE_TYPE: {
        return (
          <FilterDate key={'filter-' + filterIndex} filterItem={filterItem as FilterDateItem} />
        );
      }
      default:
        return null;
    }
  };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  filterHandler: any;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const result = {
    filterHandler: getAllFilterValueObjs(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {};

/** connect clientsList to the redux store */
const ConnectedFilter = connect(
  mapStateToProps,
  mapDispatchToProps
)(Filter);

export default ConnectedFilter;
