import * as React from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import { Col, FormGroup, Input, Label, Row } from 'reactstrap';
import { Store } from 'redux';
import { FilterItem } from '..';
import { getNativeLanguageText } from '../../../helpers/utils';
import {
    FilterCondition,
    FilterValue,
    getFilterCondition,
    getFilterValue,
    setConditionValue,
    setFilterValue,
} from '../../../store/ducks/filter';
import { FILTER_TEXT_TYPE } from '../constants';
import {
    CONTAINS_TYPE,
    ENDS_WITH_TYPE,
    EQUAL_TYPE,
    NOT_CONTAINS_TYPE,
    NOT_EQUAL_TYPE,
    STARTS_WITH_TYPE,
    TEXT_FILTER_OPERATORS,
} from './constants';

export interface FilterTextItem extends FilterItem {
    type: FILTER_TEXT_TYPE;
}

export interface TextProps {
    filterItem: FilterTextItem;
    value: FilterValue;
    condition: FilterCondition;
    setConditionValueActionCreator: typeof setConditionValue;
    setFilterValueActionCreator: typeof setFilterValue;
    appLanguage: string;
}

class FilterText extends React.Component<TextProps> {
    public componentDidMount() {
        const { filterItem, value } = this.props;
        this.props.setConditionValueActionCreator(
            filterItem.name,
            EQUAL_TYPE,
            this.generateSqlText(filterItem, EQUAL_TYPE, value),
        );
    }

    public render() {
        const { filterItem, value, condition, appLanguage } = this.props;
        return (
            <FormGroup style={{ marginBottom: 0 }}>
                <Row>
                    <Col md={3}>
                        <Label>{getNativeLanguageText(filterItem.label, appLanguage)}</Label>
                    </Col>
                    <Col md={3}>
                        <Select
                            options={TEXT_FILTER_OPERATORS}
                            values={TEXT_FILTER_OPERATORS.filter((filterObj) => filterObj.value === condition)}
                            onChange={this.handleConditionChange}
                        />
                    </Col>
                    <Col md={6}>
                        <Input type="text" name={filterItem.name} value={value || ''} onChange={this.handleValueChange} />
                    </Col>
                </Row>
            </FormGroup>
        );
    }

    private handleValueChange = (event: React.FormEvent<HTMLInputElement>) => {
        const { filterItem, condition } = this.props;
        this.props.setFilterValueActionCreator(
            filterItem.name,
            [event.currentTarget.value],
            this.generateSqlText(filterItem, condition, [event.currentTarget.value]),
        );
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
     * @param {FilterTextItem} filterItem - the filter text item
     * @param {FilterCondition} condition - the filter condition
     * @param {FilterValue} value - the filter value
     * @returns {string} - the relevant WHERE SQL text
     */
    private generateSqlText = (filterItem: FilterTextItem, condition: FilterCondition, value: FilterValue): string => {
        if (condition && value && value.length > 0 && value[0] !== '') {
            switch (condition) {
                case CONTAINS_TYPE:
                    return `instr("${filterItem.name}", "${value[0]}") > 0`;
                case NOT_CONTAINS_TYPE:
                    return `instr("${filterItem.name}", "${value[0]}") < 1`;
                case STARTS_WITH_TYPE:
                    return `${filterItem.name} like "${value[0]}%"`;
                case ENDS_WITH_TYPE:
                    return `${filterItem.name} like "%${value[0]}"`;
                case EQUAL_TYPE:
                    return `${filterItem.name} = "${value[0]}"`;
                case NOT_EQUAL_TYPE:
                    return `${filterItem.name} != "${value[0]}"`;
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
    filterItem: FilterTextItem;
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
const ConnectedFilterText = connect(mapStateToProps, mapDispatchToProps)(FilterText);

export default ConnectedFilterText;
