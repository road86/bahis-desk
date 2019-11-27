import * as React from 'react';
import Select from 'react-select';
import { FormGroup, Input, Label } from 'reactstrap';
import { FilterItem } from '..';
import { FILTER_TEXT_TYPE } from '../constants';
import { TEXT_FILTER_OPERATORS } from './constants';

export interface FilterTextItem extends FilterItem {
  type: FILTER_TEXT_TYPE;
}

export interface TextProps {
  filterItem: FilterTextItem;
}

class FilterText extends React.Component<TextProps> {
  public render() {
    const { filterItem } = this.props;
    return (
      <FormGroup>
        <Label>Text</Label>
        <Select options={TEXT_FILTER_OPERATORS} />
        <Input type="text" name={filterItem.name} />
      </FormGroup>
    );
  }
}

export default FilterText;
