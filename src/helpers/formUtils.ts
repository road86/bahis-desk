import { logger } from './logger';

const SELECT_ALL = 'select all that apply';
const SELECT_ONE = 'select one';

const createFormKeyValuePair = (definition: any, fieldNames: any, data: any, choices: any) => {
    const formData: any[] = [];
    const userInput = Object.entries(data);
    fieldNames.forEach((element: any) => {
        const exist = userInput.find((obj: any) => obj[0] === element);
        if (exist) {
            let formField: any = {};
            if (exist[0].includes('/')) {
                const fields = exist[0].split('/');
                let children = definition.children;
                for (let i = 0; i <= fields.length - 2; i++) {
                    const groupObj = children.find((obj: any) => obj.name === fields[i]);
                    if (groupObj) {
                        children = groupObj.children;
                    }
                }
                formField = children.find((obj: any) => obj.name === fields[fields.length - 1]);
            } else {
                formField = definition.children.find((obj: any) => obj.name === exist[0]);
            }
            if (formField) {
                logger.info(' form field ');
                logger.info(formField);
                formData.push({
                    label: formField.label,
                    value: getReadableValue(exist[1], formField, choices),
                });
                logger.info(formField.label, exist[1]);
            }
        }
    });
    return formData;
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
                // choice.value_label = JSON.parse(choice.value_label);
                logger.info('got it: ', formField.name, fieldValue);
                if (typeof choice.value_label === 'string') {
                    try {
                        const result = JSON.parse(choice.value_label);
                        return result.English;
                    } catch (err) {
                        return choice.value_label;
                    }
                } else if (typeof choice.value_label === 'object') {
                    logger.info('ans: ', choice.value_label.English);
                    return choice.value_label.English;
                }
            }
        }
    } else {
        return typeof fieldValue == 'string' ? fieldValue : JSON.stringify(fieldValue);
    }
};

const makeLabelColumnPair = (definition: any, fieldNames: any) => {
    const formData: any[] = [];
    fieldNames.forEach((element: any) => {
        let formField: any = {};
        if (element.includes('/')) {
            const fields = element.split('/');
            let children = definition.children;
            for (let i = 0; i <= fields.length - 2; i++) {
                const groupObj = children.find((obj: any) => obj.name === fields[i]);
                if (groupObj) {
                    children = groupObj.children;
                }
            }
            formField = children.find((obj: any) => obj.name === fields[fields.length - 1]);
        } else {
            formField = definition.children.find((obj: any) => obj.name === element);
        }
        if (formField) {
            logger.info(' form field ');
            logger.info(formField);
            formData.push({
                label: formField.label,
                value: element,
            });
        }
    });
    return formData;
};

export { createFormKeyValuePair, getReadableValue, makeLabelColumnPair };
