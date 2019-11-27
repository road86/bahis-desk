import * as React from 'react';
import Select from 'react-select';
import { FormGroup, Input, Label } from 'reactstrap';
import { FilterItem } from '..';
import { FILTER_NUMBER_TYPE } from '../constants';
import { NUMBER_FILTER_OPERATORS } from './constants';

export interface FilterNumberItem extends FilterItem {
  type: FILTER_NUMBER_TYPE;
}

export interface NumberProps {
  filterItem: FilterNumberItem;
}

class FilterNumber extends React.Component<NumberProps> {
  public render() {
    const { filterItem } = this.props;
    return (
      <FormGroup>
        <Label>Number</Label>
        <Select options={NUMBER_FILTER_OPERATORS} />
        <Input type="number" name={filterItem.name} />
      </FormGroup>
    );
  }
}

export default FilterNumber;
