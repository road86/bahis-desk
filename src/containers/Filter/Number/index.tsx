import { Grid, Input, Typography } from '@material-ui/core';
import * as React from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import { Store } from 'redux';
import { FilterItem } from '..';
import { logger } from '../../../helpers/logger';
import { getNativeLanguageText } from '../../../helpers/utils';
import {
    FilterCondition,
    FilterValue,
    getFilterCondition,
    getFilterValue,
    setConditionValue,
    setFilterValue,
} from '../../../store/ducks/filter';
import { FILTER_NUMBER_TYPE } from '../constants';
import {
    EQUAL_TYPE,
    GREATER_THAN_EQUAL_TYPE,
    GREATER_THAN_TYPE,
    IN_BETWEEN_TYPE,
    LESS_THAN_EQUAL_TYPE,
    LESS_THAN_TYPE,
    NOT_EQUAL_TYPE,
    NUMBER_FILTER_OPERATORS,
} from './constants';

export interface FilterNumberItem extends FilterItem {
    type: FILTER_NUMBER_TYPE;
}

export interface NumberProps {
    filterItem: FilterNumberItem;
    value: FilterValue;
    condition: FilterCondition;
    setConditionValueActionCreator: typeof setConditionValue;
    setFilterValueActionCreator: typeof setFilterValue;
    appLanguage: string;
}

class FilterNumber extends React.Component<NumberProps> {
    public componentDidMount() {
        const { filterItem, value } = this.props;
        this.props.setConditionValueActionCreator(
            filterItem.name,
            EQUAL_TYPE,
            this.generateSqlText(filterItem, EQUAL_TYPE, value),
        );
    }

    public render() {
        logger.info('rendering FilterNumber');
        // TODO is this ever used?
        const { filterItem, condition, value, appLanguage } = this.props;
        if (condition !== IN_BETWEEN_TYPE && value && value.length > 1) {
            this.props.setFilterValueActionCreator(
                filterItem.name,
                [value[0]],
                this.generateSqlText(filterItem, condition, [value[0]]),
            );
        }
        return (
            <Grid container xs={12} spacing={2}>
                <Grid item md={3}>
                    <Typography>{getNativeLanguageText(filterItem.label, appLanguage)}</Typography>
                </Grid>
                <Grid item md={3}>
                    <Select
                        options={NUMBER_FILTER_OPERATORS}
                        values={NUMBER_FILTER_OPERATORS.filter((filterObj) => filterObj.value === condition)}
                        onChange={this.handleConditionChange}
                    />
                </Grid>
                <Grid item md={condition === IN_BETWEEN_TYPE ? 3 : 6}>
                    <Input
                        type="number"
                        value={value && value[0] ? value[0] : ''}
                        name={filterItem.name}
                        onChange={this.handleValueChange}
                    />
                </Grid>
                {condition === IN_BETWEEN_TYPE && (
                    <Grid item md={3}>
                        <Input
                            type="number"
                            name={filterItem.name + '_v2'}
                            value={value && value[1] ? value[1] : ''}
                            onChange={this.handleValueChange}
                        />
                    </Grid>
                )}
            </Grid>
        );
    }

    private handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { filterItem, condition, value } = this.props;
        let tmpVal;
        if (event.currentTarget.name === filterItem.name + '_v2') {
            tmpVal = [value && value[0] ? value[0] : '', event.currentTarget.value];
        } else {
            tmpVal = value && value[1] ? [event.currentTarget.value, value[1]] : [event.currentTarget.value];
        }
        this.props.setFilterValueActionCreator(filterItem.name, tmpVal, this.generateSqlText(filterItem, condition, tmpVal));
    };

    private handleConditionChange = (selectedOption: any) => {
        const { filterItem, value } = this.props;
        this.props.setConditionValueActionCreator(
            filterItem.name,
            selectedOption.value,
            this.generateSqlText(filterItem, selectedOption.value, value),
        );
    };

    /** generates the SQL where text relative to filter condition, value
     * @param {FilterNumberItem} filterItem - the filter text item
     * @param {FilterCondition} condition - the filter condition
     * @param {FilterValue} value - the filter value
     * @returns {string} - the relevant WHERE SQL text
     */
    private generateSqlText = (filterItem: FilterNumberItem, condition: FilterCondition, value: FilterValue): string => {
        if (condition && value && value.length > 0 && value[0] !== '') {
            switch (condition) {
                case GREATER_THAN_TYPE:
                    return `cast("${filterItem.name}" as float) > ${value[0]}`;
                case GREATER_THAN_EQUAL_TYPE:
                    return `cast("${filterItem.name}" as float) >= ${value[0]}`;
                case LESS_THAN_TYPE:
                    return `cast("${filterItem.name}" as float) < ${value[0]}`;
                case LESS_THAN_EQUAL_TYPE:
                    return `cast("${filterItem.name}" as float) <= ${value[0]}`;
                case EQUAL_TYPE:
                    return `cast("${filterItem.name}" as float) = ${value[0]}`;
                case NOT_EQUAL_TYPE:
                    return `cast("${filterItem.name}" as float) != ${value[0]}`;
                case IN_BETWEEN_TYPE:
                    if (value.length > 1 && value[1] !== '') {
                        return `cast("${filterItem.name}" as float) >= ${value[0]} and cast("${filterItem.name}" as float) <= ${value[1]}`;
                    }
                    return '';
            }
        }
        return '';
    };
}

/** connect the component to the store */

/** Interface to describe props from mapStateToProps */
interface DispatchedStateProps {
    value: FilterValue;
    condition: FilterCondition;
}

/** Interface to describe props from parent */
interface ParentProps {
    filterItem: FilterNumberItem;
}

/** Map props to state  */
const mapStateToProps = (state: Partial<Store>, parentProps: ParentProps): DispatchedStateProps => {
    const { filterItem } = parentProps;
    const result = {
        condition: getFilterCondition(state, filterItem.name),
        value: getFilterValue(state, filterItem.name),
    };
    return result;
};

/** map props to actions */
const mapDispatchToProps = {
    setConditionValueActionCreator: setConditionValue,
    setFilterValueActionCreator: setFilterValue,
};

/** connect clientsList to the redux store */
const ConnectedFilterNumber = connect(mapStateToProps, mapDispatchToProps)(FilterNumber);

export default ConnectedFilterNumber;
