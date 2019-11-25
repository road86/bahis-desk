import * as React from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import Filter from '../../containers/Filter';
import { ipcRenderer } from '../../services/ipcRenderer';

/** interface for Form URL params */
interface ListURLParams {
  id: string;
}

interface ListState {
  filterDefinition: any;
  tableDefinition: any;
}

class List extends React.Component<RouteComponentProps<ListURLParams>, ListState> {
  constructor(props: any) {
    super(props);
    this.state = { filterDefinition: null, tableDefinition: null };
  }
  public async componentDidMount() {
    const { match } = this.props;
    const listId = match.params.id || '';
    const { filterDefinition } = await ipcRenderer.sendSync('fetch-list-definition', listId);
    this.setState({
      ...this.state,
      filterDefinition: filterDefinition ? JSON.parse(filterDefinition) : null,
    });
  }
  public render() {
    const { filterDefinition } = this.state;
    return (
      <div>
        <Link to="/">
          <h1>Back</h1>
        </Link>
        <div> {filterDefinition || ''} </div>
        <Filter />
      </div>
    );
  }
}

export default withRouter(List);
