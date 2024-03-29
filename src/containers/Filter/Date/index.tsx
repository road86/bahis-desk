import { Grid, Typography } from '@material-ui/core';
import * as React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
import { FILTER_DATE_TYPE } from '../constants';
import './Date.css';
import {
    DATE_FILTER_OPERATORS,
    EQUAL_TYPE,
    GREATER_THAN_EQUAL_TYPE,
    GREATER_THAN_TYPE,
    IN_BETWEEN_TYPE,
    LESS_THAN_EQUAL_TYPE,
    LESS_THAN_TYPE,
    NOT_EQUAL_TYPE,
} from './constants';

export interface FilterDateItem extends FilterItem {
    type: FILTER_DATE_TYPE;
}

export interface DateProps {
    filterItem: FilterDateItem;
    value: FilterValue;
    condition: FilterCondition;
    setConditionValueActionCreator: typeof setConditionValue;
    setFilterValueActionCreator: typeof setFilterValue;
    appLanguage: string;
}

class FilterDate extends React.Component<DateProps> {
    public componentDidMount() {
        const { filterItem, value } = this.props;
        logger.info(filterItem);
        this.props.setConditionValueActionCreator(
            filterItem.name,
            IN_BETWEEN_TYPE,
            this.generateSqlText(filterItem, IN_BETWEEN_TYPE, value),
        );
    }

    public render() {
        const { filterItem, condition, value, appLanguage } = this.props;
        if (condition !== IN_BETWEEN_TYPE && value && value.length > 1) {
            this.props.setFilterValueActionCreator(
                filterItem.name,
                [value[0]],
                this.generateSqlText(filterItem, condition, [value[0]]),
            );
        }
        const startDate = value && value[0] ? new Date(value[0]) : null;
        const endDate = value && value[1] ? new Date(value[1]) : null;
        if (startDate && endDate && endDate < startDate) {
            this.props.setFilterValueActionCreator(
                filterItem.name,
                [startDate ? startDate.toISOString() : ''],
                this.generateSqlText(filterItem, condition, [startDate ? startDate.toISOString() : '']),
            );
        }
        return (
            <Grid container xs={12} spacing={2}>
                <Grid item md={3}>
                    <Typography>{getNativeLanguageText(filterItem.label, appLanguage)}</Typography>
                </Grid>
                <Grid item md={3}>
                    <Select
                        options={DATE_FILTER_OPERATORS}
                        values={DATE_FILTER_OPERATORS.filter((filterObj) => filterObj.value === condition)}
                        onChange={this.handleConditionChange}
                    />
                </Grid>
                <Grid item md={condition === IN_BETWEEN_TYPE ? 3 : 6}>
                    <DatePicker className="form-control" selected={startDate} onChange={this.handleStartDate} /> <br />
                </Grid>
                {condition === IN_BETWEEN_TYPE && (
                    <Grid item md={3}>
                        <DatePicker
                            className="form-control"
                            selected={endDate}
                            onChange={this.handleEndDate}
                            minDate={startDate}
                        />
                    </Grid>
                )}
            </Grid>
        );
    }

    private handleStartDate = (selectedDate: any) => {
        const { filterItem, condition, value } = this.props;
        const selectedDateString = selectedDate
            ? `${selectedDate.getFullYear()}-${
                  selectedDate.getMonth() + 1 < 10 ? '0' + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1
              }-${selectedDate.getDate() < 10 ? '0' + selectedDate.getDate() : selectedDate.getDate()}T00:00:00.000Z`
            : '';
        const tmpVal = value && value[1] ? [selectedDateString, value[1]] : [selectedDateString];
        this.props.setFilterValueActionCreator(filterItem.name, tmpVal, this.generateSqlText(filterItem, condition, tmpVal));
    };

    private handleEndDate = (selectedDate: any) => {
        const { filterItem, condition, value } = this.props;
        const selectedDateString = selectedDate
            ? `${selectedDate.getFullYear()}-${
                  selectedDate.getMonth() + 1 < 10 ? '0' + (selectedDate.getMonth() + 1) : selectedDate.getMonth() + 1
              }-${selectedDate.getDate() < 10 ? '0' + selectedDate.getDate() : selectedDate.getDate()}T00:00:00.000Z`
            : '';
        const tmpVal = [value && value[0] ? value[0] : '', selectedDateString];
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
     * @param {FilterDateItem} filterItem - the filter text item
     * @param {FilterCondition} condition - the filter condition
     * @param {FilterValue} value - the filter value
     * @returns {string} - the relevant WHERE SQL text
     */
    private generateSqlText = (filterItem: FilterDateItem, condition: FilterCondition, value: FilterValue): string => {
        if (condition && value && value.length > 0 && value[0] !== '') {
            switch (condition) {
                case GREATER_THAN_TYPE:
                    return `date(${filterItem.name}) > date('${value[0]}')`;
                case GREATER_THAN_EQUAL_TYPE:
                    return `date(${filterItem.name}) >= date('${value[0]}')`;
                case LESS_THAN_TYPE:
                    return `date(${filterItem.name}) < date('${value[0]}')`;
                case LESS_THAN_EQUAL_TYPE:
                    return `date(${filterItem.name}) <= date('${value[0]}')`;
                case EQUAL_TYPE:
                    return `date(${filterItem.name}) = date('${value[0]}')`;
                case NOT_EQUAL_TYPE:
                    return `date(${filterItem.name}) != date('${value[0]}')`;
                case IN_BETWEEN_TYPE:
                    if (value.length > 1 && value[1] !== '') {
                        return `date(${filterItem.name}) >= date('${value[0]}') and date(${filterItem.name}) <= date('${value[1]}')`;
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
    filterItem: FilterDateItem;
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
const ConnectedFilterDate = connect(mapStateToProps, mapDispatchToProps)(FilterDate);

export default ConnectedFilterDate;
