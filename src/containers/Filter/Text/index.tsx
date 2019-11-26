import * as React from 'react';
import { FormGroup, Input, Label } from 'reactstrap';
import { FilterItem } from '..';

export interface TextProps {
  filterItem: FilterItem;
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
