import * as React from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import { FILTER_CHOICES } from '../../constants';
import Filter from '../../containers/Filter';
import { ipcRenderer } from '../../services/ipcRenderer';
import ListTable from '../ListTable';

/** interface for Form URL params */
interface ListURLParams {
  id: string;
}

/** interface for List state */
interface ListState {
  filterDefinition: any;
  columnDefinition: any;
}

class List extends React.Component<RouteComponentProps<ListURLParams>, ListState> {
  constructor(props: any) {
    super(props);
    this.state = { filterDefinition: null, columnDefinition: null };
  }
  public async componentDidMount() {
    const { match } = this.props;
    const listId = match.params.id || '';
    const { columnDefinition, filterDefinition } = await ipcRenderer.sendSync(
      'fetch-list-definition',
      listId
    );
    this.setState({
      ...this.state,
      columnDefinition: columnDefinition ? JSON.parse(columnDefinition) : null,
      filterDefinition: filterDefinition ? JSON.parse(filterDefinition) : null,
    });
  }
  public render() {
    const { columnDefinition, filterDefinition } = this.state;
    return (
      <div>
        <Link to="/">
          <h1>Back</h1>
        </Link>
        {filterDefinition && <Filter definition={filterDefinition} choices={FILTER_CHOICES} />}
        {columnDefinition && <ListTable columnDefinition={columnDefinition} />}
      </div>
    );
  }
}

export default withRouter(List);
