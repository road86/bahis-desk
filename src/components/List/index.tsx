// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { makeStyles, Typography, useTheme } from '@material-ui/core';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Col, Row } from 'reactstrap';
import { FILTER_CHOICES } from '../../constants';
import Filter from '../../containers/Filter';
import ListTable from '../../containers/ListTable';
// import { ColumnnDefinition } from '../../containers/ListTable/constants';
import { getNativeLanguageText } from '../../helpers/utils';
// import { getNativeLanguageText } from '../../helpers/utils';
import { ipcRenderer } from '../../services/ipcRenderer';
import { listPageStyles } from './style';

/** interface for Form URL params */
interface ListURLParams {
  id: string;
}

/** interface for List props */
interface ListProps extends RouteComponentProps<ListURLParams> {
  appLanguage: string;
}

// /** interface for List state */
// interface ListState {
//   filterDefinition: any;
//   columnDefinition: any;
//   datasource: any;
//   filtersValue: any;
//   listHeader: { [key: string]: string };
//   listId: string;
// }

function List(props: ListProps) {
  const [columnDefinition, setColumnDefinition] = React.useState<any>(null);
  const [filterDefinition, setFilterDefinition] = React.useState<any>(null);
  const [datasource, setDataSource] = React.useState<any>(null);
  const [filtersValue, setFilterValue] = React.useState<any>({});
  const [listHeader, setListHeader] = React.useState<{ [key: string]: string }>({});
  const [listId, setListId] = React.useState<string>('');

  const comUpdate = async () => {
    const { match } = props;
    const listId = match.params.id || '';

    console.log('------------------list id -----------------');
    console.log(listId);
    const response = await ipcRenderer.sendSync(
      'fetch-list-definition',
      listId,
    );
    //Maybe this wont work with === ? 
    if (response !== null || response !== undefined) {
      const { columnDefinition, filterDefinition, datasource, listHeader } = response;

      setDataSource(datasource ? JSON.parse(datasource) : null);
      setFilterDefinition(filterDefinition ? JSON.parse(filterDefinition) : null);
      setListHeader(listHeader ? JSON.parse(listHeader) : {});
      // if (listId == '24') {
      //   setColumnDefinition(ColumnnDefinition as any)
      // } else {
      //   setColumnDefinition(columnDefinition ? JSON.parse(columnDefinition) : null);
      // }
      setColumnDefinition(columnDefinition ? JSON.parse(columnDefinition) : null);
      setListId(listId);
    }
  }

  React.useEffect(() => {
  }, [])

  const setFiltersValue = (filtersValue: any) => {
    setFilterValue(filtersValue);
  };

  const { appLanguage } = props;

  const theme = useTheme();
  const useStyles = makeStyles(listPageStyles(theme));
  const classes = useStyles();

  return (
    <React.Fragment>
      {
          <Typography color="secondary" component="h1" variant="h4" align="center" style={{ marginTop: '10%' }}>
            Customisable lists are not available yet. We are working hard to provide this feature for you as soon as possible. 
          </Typography>
      }
    </React.Fragment>
  );
}

export default withRouter(List);
