import * as React from 'react';
import { FormGroup, Input, Label } from 'reactstrap';
import { FilterItem } from '..';
import { FILTER_TEXT_TYPE } from '../constants';

interface FilterTextItem extends FilterItem {
  type: FILTER_TEXT_TYPE;
}

export interface TextProps {
  filterItem: FilterTextItem;
}

class Text extends React.Component<TextProps> {
  public render() {
    const { filterItem } = this.props;
    return (
      <FormGroup>
        <Label>Text</Label>
        <Input type="text" name={filterItem.name} />
      </FormGroup>
    );
  }
}

export default Text;
