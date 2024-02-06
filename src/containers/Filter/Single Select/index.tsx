import { Grid, Typography } from '@material-ui/core';
import lodash from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import { Store } from 'redux';
import { FilterItem } from '..';
import { logger } from '../../../helpers/logger';
import { getNativeLanguageText } from '../../../helpers/utils';
import { ipcRenderer } from '../../../services/ipcRenderer';
import {
    FilterCondition,
    FiltersValueObj,
    FilterValue,
    getAllFilterValueObjs,
    getFilterCondition,
    getFilterValue,
    setConditionValue,
    setFilterValue,
} from '../../../store/ducks/filter';
import { FILTER_SINGLE_SELECT_TYPE } from '../constants';

const OPTION_ID = 'opt_id';
export interface FilterSingleSelectItem extends FilterItem {
    type: FILTER_SINGLE_SELECT_TYPE;
}

export interface SingleSelectProps {
    filterItem: FilterSingleSelectItem;
    value: FilterValue;
    condition: FilterCondition;
    setConditionValueActionCreator: typeof setConditionValue;
    setFilterValueActionCreator: typeof setFilterValue;
    appLanguage: string;
    listId: string;
    filtersValueObj: FiltersValueObj;
    columnDefinition: any;
    datasource: any;
}

export interface FilterOption {
    label: string;
    value: string;
}
export type FilterOptions = FilterOption[];
export type FilterDataset = any[];

export interface SingleSelectState {
    filterOptions: FilterOptions;
    filterDataset: FilterDataset;
}

class FilterSingleSelect extends React.Component<SingleSelectProps, SingleSelectState> {
    public state = { filterOptions: [], filterDataset: [] };

    public getLookupOptions = async (column: any) => {
        const { datasource } = this.props;
        try {
            if (column.lookup_definition == null) return;

            const query = `with list_table as ( 
        ${datasource.query}
      ), lookup_table as (
        ${column.lookup_definition.query}
      ) select
        list_table.id,
        lookup_table.${column.lookup_definition.return_column},
        lookup_table.${column.lookup_definition.match_column} as ${OPTION_ID}
      from list_table left join lookup_table on list_table.${column.field_name} = lookup_table.${column.lookup_definition.match_column}`;

            const resp: any = await ipcRenderer.sendSync('fetch-query-data', query);

            const unqOb: any = {};
            resp.forEach((e: any) => {
                unqOb[`${e[column.lookup_definition.return_column]}`] = e[OPTION_ID];
            });

            const options = Object.keys(unqOb).map((k: any) => ({ label: k, value: unqOb[k] }));
            return { filterOptions: options };
        } catch (err) {
            return { filterOptions: [] };
        }
    };

    public getNormalOptions = async () => {
        const { filterItem, filtersValueObj, listId } = this.props;
        let dependency = filterItem.dependency
            ? typeof filterItem.dependency === 'string'
                ? [filterItem.dependency]
                : filterItem.dependency
            : [];
        dependency = [...dependency, filterItem.name];
        const response = await ipcRenderer.sendSync('fetch-filter-dataset', listId, dependency);
        const options = this.fetchOptionsFromDataset(filterItem, response, filtersValueObj);
        return { filterDataset: response, filterOptions: options };
    };

    public getFilterOptions = async () => {
        const { filterItem, columnDefinition } = this.props;
        const column = columnDefinition.find((cd: any) => cd.field_name === filterItem.name);
        return column.lookup_definition ? await this.getLookupOptions(column) : await this.getNormalOptions();
    };

    public async componentDidMount() {
        const result: any = await this.getFilterOptions();
        logger.info('new Options: ', result.filterOptions);
        this.setState({ ...this.state, ...result });
    }

    public async componentDidUpdate() {
        const { filterItem, value } = this.props;
        const { filterOptions } = this.state;
        const result: any = await this.getFilterOptions();
        const options = result.filterOptions;

        if (JSON.stringify(options) !== JSON.stringify(filterOptions)) {
            const optionValues = options.map((option: FilterOption) => option.value);
            const newValues = (value || []).filter(
                (valueItem) => valueItem && valueItem !== '' && optionValues.includes(valueItem),
            );

            this.props.setFilterValueActionCreator(
                filterItem.name,
                newValues,
                this.generateSqlText(filterItem, 'single select', newValues),
            );
            this.setState({ ...this.state, filterOptions: options });
        }
    }

    public render() {
        logger.info('rendering FilterSingleSelect');
        // TODO is this even used
        const { filterItem, appLanguage, value } = this.props;
        const { filterOptions } = this.state;
        logger.info('filter options: ', this.state.filterOptions);
        return (
            <Grid container xs={12} spacing={2}>
                <Grid item md={3}>
                    <Typography>{getNativeLanguageText(filterItem.label, appLanguage)}</Typography>
                </Grid>
                <Grid item md={3} />
                <Grid item md={6}>
                    <Select
                        options={filterOptions}
                        values={filterOptions.filter((filterObj: any) => value && (value as any[]).includes(filterObj.value))}
                        onChange={this.handleValueChange}
                    />
                </Grid>
            </Grid>
        );
    }

    private handleValueChange = (selectedOption: any) => {
        const { filterItem } = this.props;
        this.props.setFilterValueActionCreator(
            filterItem.name,
            [selectedOption.value],
            this.generateSqlText(filterItem, 'single select', [selectedOption.value]),
        );
    };

    /** generates the SQL where text relative to filter condition, value
     * @param {FilterTextItem} filterItem - the filter text item
     * @param {FilterCondition} condition - the filter condition
     * @param {FilterValue} value - the filter value
     * @returns {string} - the relevant WHERE SQL text
     */
    private generateSqlText = (filterItem: FilterSingleSelectItem, condition: FilterCondition, value: FilterValue): string => {
        if (condition && value && value.length > 0 && value[0] !== '') {
            return `${filterItem.name} = "${value[0]}"`;
        }
        return '';
    };

    private fetchOptionsFromDataset = (
        filterItem: FilterItem,
        filterDataset: FilterDataset,
        filtersValueObj: FiltersValueObj,
    ): FilterOptions => {
        const options: FilterOptions = [];
        const filterItems = lodash.filter(filterDataset, (row) => {
            const dependency = filterItem.dependency
                ? typeof filterItem.dependency === 'string'
                    ? [filterItem.dependency]
                    : filterItem.dependency
                : [];
            if (dependency && dependency.length > 0) {
                let flag = true;
                dependency.forEach((conditionKey) => {
                    flag =
                        flag &&
                        filtersValueObj[conditionKey] &&
                        filtersValueObj[conditionKey].value &&
                        row[conditionKey] &&
                        (filtersValueObj[conditionKey].value as string[]).includes(row[conditionKey] as string);
                });
                return flag;
            }
            return true;
        });
        filterItems.forEach((item) => {
            if (filterItem.name in item) {
                options.push({ label: item[filterItem.name], value: item[filterItem.name] });
            }
        });
        return options;
    };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
    value: FilterValue;
    condition: FilterCondition;
    filtersValueObj: FiltersValueObj;
}

/** Interface to describe props from parent */
interface ParentProps {
    filterItem: FilterSingleSelectItem;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>, parentProps: ParentProps): DispatchedStateProps => {
    const { filterItem } = parentProps;
    const result = {
        condition: getFilterCondition(state, filterItem.name),
        filtersValueObj: getAllFilterValueObjs(state),
        value: getFilterValue(state, filterItem.name),
    };
    return result;
};

/** map props to actions */
const mapDispatchToProps = {
    setConditionValueActionCreator: setConditionValue,
    setFilterValueActionCreator: setFilterValue,
};

/** connect FilterSingleSelect to the redux store */
const ConnectedFilterSingleSelect = connect(mapStateToProps, mapDispatchToProps)(FilterSingleSelect);

export default ConnectedFilterSingleSelect;
