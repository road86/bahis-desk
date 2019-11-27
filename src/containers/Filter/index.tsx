import * as React from 'react';
import { FILTER_NUMBER_TYPE, FILTER_TEXT_TYPE } from './constants';
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
}

class Filter extends React.Component<FilterProps> {
  public render() {
    const { definition } = this.props;
    return <div>{definition.map(filterItem => this.renderTypeEvaluator(filterItem))}</div>;
  }

  private renderTypeEvaluator = (filterItem: FilterItem) => {
    switch (filterItem.type) {
      case FILTER_TEXT_TYPE: {
        return <FilterText filterItem={filterItem as FilterTextItem} />;
      }
      case FILTER_NUMBER_TYPE: {
        return <FilterNumber filterItem={filterItem as FilterNumberItem} />;
      }
      default:
        return null;
    }
  };
}

export default Filter;
