import { ColumnObj } from '..';
import { logger } from '../../../helpers/logger';

/** interface for LookUpProps */
export interface LookUpProps {
    columnDef: ColumnObj;
    rowValue: { [key: string]: string };
    lookupTableForDatasource?: any;
    lookupTableForLabel?: any;
}

const SELECT_ALL = 'select all that apply';
const SELECT_ONE = 'select one';

export default function LookUp(props: any) {
    const { columnDef } = props;
    let result = null;
    if ('lookup_definition' in columnDef && columnDef.lookup_definition !== undefined) {
        result =
            columnDef.lookup_definition.lookup_type === 'datasource' || columnDef.lookup_definition.lookup_type === 'table'
                ? datasourceLookup(props)
                : labelLookup(props);
    }
    return result;
}

const datasourceLookup = (props: any) => {
    const { columnDef, rowValue, lookupTableForDatasource } = props;
    if (Object.keys(lookupTableForDatasource).length > 0) {
        let result = '';
        const rows = lookupTableForDatasource[columnDef.lookup_definition.return_column];
        for (let i = 0; i < rows.length; i++) {
            if (rowValue.id === rows[i].id) {
                result = rows[i][columnDef.lookup_definition.return_column];
                break;
            }
        }
        return result;
    }
    return null;
};

const labelLookup = (props: any) => {
    const { columnDef, rowValue, lookupTableForLabel } = props;
    if (Object.keys(lookupTableForLabel).length === 0) return null;

    logger.info(' label lookup ');
    logger.info('the column: ', columnDef.field_name);
    logger.info('the value: ', rowValue[columnDef.field_name]);
    logger.info('props: ', props);

    const { simpleFormChoice, formChoices } = lookupTableForLabel[columnDef.lookup_definition.form_id];
    let { definition } = lookupTableForLabel[columnDef.lookup_definition.form_id];
    const exist = JSON.parse(definition.field_names).find(
        (obj: any) => obj.replace('/', '_').toLowerCase() === columnDef.field_name,
    );

    logger.info('exist: ', exist);
    if (exist) {
        let formField: any = {};
        definition = JSON.parse(definition.definition);
        if (exist.includes('/')) {
            const fields = exist.split('/');
            let children = definition.children;
            for (let i = 0; i <= fields.length - 2; i++) {
                const groupObj = children.find((obj: any) => obj.name === fields[i]);
                if (groupObj) {
                    children = groupObj.children;
                }
            }

            formField = children.find((obj: any) => obj.name === fields[fields.length - 1]);
        } else {
            formField = definition.children.find((obj: any) => obj.name === exist);
        }
        if (formField) {
            return getReadableValue(rowValue[columnDef.field_name], formField, { simpleFormChoice, formChoices });
        } else return null;
    }
    return null;
};

const getReadableValue = (fieldValue: any, formField: any, choices: any) => {
    //  it means that value has been selected from csv-list.
    if (formField && formField.control && formField.control.appearance && formField.control.appearance.includes('search')) {
        // eslint-disable-next-line no-useless-escape
        const processedStringArray = formField.control.appearance.match(/\([^\)]+\)/i) || [''];
        let params = processedStringArray[0];

        if (params.length > 2) {
            params = params.substring(1, params.length - 1);
            const csvName = params.split(',')[0].replaceAll("'", '');

            logger.info(formField, fieldValue);
            const csvChoices = choices.formChoices[`${csvName}.csv`];
            logger.info('choices');
            logger.info(csvChoices);
            logger.info('csvname :', csvName);
            let result = csvChoices.find(
                (option: any) => String(option[formField.children[0].name]).trim() === String(fieldValue).trim(),
            );
            logger.info('result :', result);
            if (result === undefined) return ' -- ';
            else {
                result = result[formField.children[0].label['English']];
                return result;
            }
        }
    } else if (formField.type === SELECT_ONE || formField.type === SELECT_ALL) {
        for (let i = 0; i < choices.simpleFormChoice.length; i++) {
            const choice = choices.simpleFormChoice[i];

            if (choice.field_name.includes(formField.name) && String(choice.value_text).trim() === String(fieldValue).trim()) {
                if (typeof choice.value_label === 'string') return choice.value_label;
                else if (typeof choice.value_label === 'object') {
                    return choice.value_label.English;
                }
            }
        }
    } else {
        return typeof fieldValue == 'string' ? fieldValue : JSON.stringify(fieldValue);
    }
};
