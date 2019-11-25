import * as React from 'react';
import { Link } from 'react-router-dom';
import Filter from '../../containers/Filter';

class List extends React.Component {
  public render() {
    return (
      <div>
        <Link to="/">
          <h1>Back</h1>
        </Link>
        <Filter />
      </div>
    );
  }
}

export default List;
