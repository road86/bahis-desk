import * as React from 'react';
import { Link } from 'react-router-dom';

class Filter extends React.Component {
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
