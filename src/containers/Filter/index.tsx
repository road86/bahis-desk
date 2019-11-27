import * as React from 'react';
import { Link } from 'react-router-dom';
import { FILTER_TEXT_TYPE } from './constants';
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
    return (
      <div>
        <Link to="/">
          <h1>Back</h1>
        </Link>
        {definition.map(filterItem => this.renderTypeEvaluator(filterItem))}
      </div>
    );
  }

  private renderTypeEvaluator = (filterItem: FilterItem) => {
    switch (filterItem.type) {
      case FILTER_TEXT_TYPE: {
        return <FilterText filterItem={filterItem as FilterTextItem} />;
      }
      default:
        return null;
    }
  };
}

export default Filter;
