import * as React from 'react';
import { Link } from 'react-router-dom';

interface LabelObj {
  [key: string]: string;
}

interface FilterItem {
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
    return (
      <div>
        <Link to="/">
          <h1>Back</h1>
        </Link>
      </div>
    );
  }
}

export default Filter;
