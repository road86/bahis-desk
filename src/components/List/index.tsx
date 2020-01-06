import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import { Col, Row } from 'reactstrap';
import { FILTER_CHOICES } from '../../constants';
import Filter from '../../containers/Filter';
import { getNativeLanguageText } from '../../helpers/utils';
import { ipcRenderer } from '../../services/ipcRenderer';
import ListTable from '../ListTable';
import './List.css';

/** interface for Form URL params */
interface ListURLParams {
  id: string;
}

/** interface for List props */
interface ListProps extends RouteComponentProps<ListURLParams> {
  appLanguage: string;
}

/** interface for List state */
interface ListState {
  filterDefinition: any;
  columnDefinition: any;
  datasource: any;
  filtersValue: any;
  listHeader: { [key: string]: string };
  listId: string;
}

class List extends React.Component<ListProps, ListState> {
  constructor(props: any) {
    super(props);
    this.state = {
      columnDefinition: null,
      datasource: null,
      filterDefinition: null,
      filtersValue: {},
      listHeader: {},
      listId: '',
    };
  }
  public async componentDidMount() {
    const { match } = this.props;
    const listId = match.params.id || '';
    const {
      columnDefinition,
      filterDefinition,
      datasource,
      listHeader,
    } = await ipcRenderer.sendSync('fetch-list-definition', listId);
    this.setState({
      ...this.state,
      columnDefinition: columnDefinition ? JSON.parse(columnDefinition) : null,
      datasource: datasource ? JSON.parse(datasource) : null,
      filterDefinition: filterDefinition ? JSON.parse(filterDefinition) : null,
      listHeader: listHeader ? JSON.parse(listHeader) : {},
      listId,
    });
  }
  public render() {
    const { appLanguage } = this.props;
    const { columnDefinition, datasource, filterDefinition, listHeader } = this.state;
    return (
      <div className="list-container">
        <Row id="bg-list-title-container">
          <Col>
            <div className="list-title-container">
              <Link to="/menu/">
                <h6 className="menu-back">
                  <span className="bg-menu-back">
                    <FontAwesomeIcon icon={['fas', 'arrow-left']} /> <span> Back </span>
                  </span>
                </h6>
              </Link>
              <h3 className="list-title"> {getNativeLanguageText(listHeader, appLanguage)} </h3>
            </div>
          </Col>
        </Row>
        {filterDefinition && (
          <Row>
            <Col>
              <Filter
                definition={filterDefinition}
                choices={FILTER_CHOICES}
                onSubmitHandler={this.setFiltersValue}
                appLanguage={appLanguage}
              />
            </Col>
          </Row>
        )}
        {columnDefinition && datasource && (
          <Row>
            <Col>
              <ListTable
                columnDefinition={columnDefinition}
                datasource={datasource}
                filters={this.state.filtersValue}
              />
            </Col>
          </Row>
        )}
      </div>
    );
  }

  private setFiltersValue = (filtersValue: any) => {
    this.setState({ ...this.state, filtersValue });
  };
}

export default withRouter(List);
