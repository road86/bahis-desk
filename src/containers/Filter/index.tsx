import { Accordion, AccordionDetails, AccordionSummary, makeStyles, useTheme } from '@material-ui/core';
import reducerRegistry from '@onaio/redux-reducer-registry';
import * as React from 'react';
import { connect } from 'react-redux';
import { Button, Col, Row } from 'reactstrap';
import { Store } from 'redux';
import filterReducer, {
  getAllFilterValueObjs,
  reducerName as filterReducerName,
  resetFilters,
} from '../../store/ducks/filter';
import {
  FILTER_DATE_TYPE,
  FILTER_MULTIPLE_SELECT_TYPE,
  FILTER_NUMBER_TYPE,
  FILTER_SINGLE_SELECT_TYPE,
  FILTER_TEXT_TYPE,
} from './constants';
import FilterDate, { FilterDateItem } from './Date';
import FilterMultipleSelect, { FilterMultipleSelectItem } from './Multiple Select';
import FilterNumber, { FilterNumberItem } from './Number';
import FilterSingleSelect, { FilterSingleSelectItem } from './Single Select';
import { filterStyles } from './style';
import FilterText, { FilterTextItem } from './Text';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

interface LabelObj {
  [key: string]: string;
}

export interface FilterItem {
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
  filterValue: any;
  onSubmitHandler: any;
  resetFiltersActionCreator: typeof resetFilters;
  appLanguage: string;
  listId: string;
  columnDefinition: any;
  datasource: any;
}

// interface FilterState {
//   isEnvSet: boolean;
// }

/** register the filter reducer */
reducerRegistry.register(filterReducerName, filterReducer);

function Filter(props: FilterProps) {
  // class Filter extends React.Component<FilterProps, FilterState> {
  //   public state = { isEnvSet: false };
  const [isEnvSet, setIsEnvSet] = React.useState<boolean>(false);
  //   public componentDidMount() {

  //   }
  //TODO fix this mess:   Line 76:6:  React Hook React.useEffect has a missing dependency: 'props'. Either include it or remove the dependency array. However, 'props' will change when *any* prop changes, so the preferred fix is to destructure the 'props' object outside of the useEffect call and refer to those specific props inside React.useEffect  react-hooks/exhaustive-deps

  React.useEffect(() => {
    props.resetFiltersActionCreator();
    setIsEnvSet(true);
  }, [])


  const renderTypeEvaluator = (filterItem: FilterItem, filterIndex: number, appLanguage: string, listId: string) => {
    switch (filterItem.type) {
      case FILTER_TEXT_TYPE: {
        return (
          <FilterText
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterTextItem}
            appLanguage={appLanguage}
          />
        );
      }
      case FILTER_NUMBER_TYPE: {
        return (
          <FilterNumber
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterNumberItem}
            appLanguage={appLanguage}
          />
        );
      }
      case FILTER_DATE_TYPE: {
        return (
          <FilterDate
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterDateItem}
            appLanguage={appLanguage}
          />
        );
      }
      case FILTER_SINGLE_SELECT_TYPE: {
        return (
          <FilterSingleSelect
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterSingleSelectItem}
            appLanguage={appLanguage}
            listId={listId}
            columnDefinition={props.columnDefinition}
            datasource={props.datasource}
          />
        );
      }
      case FILTER_MULTIPLE_SELECT_TYPE: {
        return (
          <FilterMultipleSelect
            key={'filter-' + filterIndex}
            filterItem={filterItem as FilterMultipleSelectItem}
            appLanguage={appLanguage}
            listId={listId}
          />
        );
      }
      default:
        return null;
    }
  };

  // tslint:disable-next-line: variable-name
  const filterHandler = (_event: any) => {
    props.onSubmitHandler(props.filterValue);
  };

  // tslint:disable-next-line: variable-name
  const resetFilterHandler = (_event: any) => {
    props.resetFiltersActionCreator();
    props.onSubmitHandler({});
  };

  const theme = useTheme();
  const useStyles = makeStyles(filterStyles(theme));
  const classes = useStyles();

  const { definition, appLanguage, listId } = props;
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header"
        className={classes.root}>
        Filter
      </AccordionSummary>
      <AccordionDetails>
        <div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
          <Row id="menu-body">
            {isEnvSet &&
              definition.map((filterItem, index) => (
                <Col key={'filter-' + index} className="menu-item" lg={12} md={12} sm={12} xs={12}>
                  {renderTypeEvaluator(filterItem, index, appLanguage, listId)}
                </Col>
              ))}
          </Row>
          <Button className={classes.submitButton} size="sm" onClick={(e: any) => filterHandler(e)}>
            Submit
          </Button>
          <Button className={classes.resetButton} size="sm" onClick={(e: any) => resetFilterHandler(e)}>
            Reset
          </Button>
        </div>
      </AccordionDetails>
    </Accordion>
  );
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
  filterValue: any;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>): DispatchedStateProps => {
  const result = {
    filterValue: getAllFilterValueObjs(state),
  };
  return result;
};

/** map props to actions */
const mapDispatchToProps = {
  resetFiltersActionCreator: resetFilters,
};

/** connect clientsList to the redux store */
const ConnectedFilter = connect(mapStateToProps, mapDispatchToProps)(Filter);

export default ConnectedFilter;
