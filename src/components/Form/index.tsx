import OdkFormRenderer from 'odkformrenderer'; // FIXME this is the big one to remove
import queryString from 'query-string';
import { Typography } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { ipcRenderer } from '../../services/ipcRenderer';
import AlertDialog from './dialog';
import './Form.css'; // FIXME this seems stupid?
import { logger } from '../../helpers/logger';

interface FormURLParams {
    id: string;
}

interface formProps extends RouteComponentProps<FormURLParams> {
    appLanguage: string;
    setUnsyncCount: any;
}

const getSearchDBProperties = (question: any, path: any) => {
    const pickSearchDBVariable = (appearance: any) => {
        const arr = appearance.split(',').filter((data: any) => data.includes('searchDB'));
        return arr.length > 0 ? arr[0].trim() : arr.trim();
    };

    let properties: any = [];
    if (question && question.children !== undefined) {
        for (let i = 0; i < question.children.length; i++) {
            const ques = question.children[i];
            const questionPath = `${path}/${ques.name}`;

            if (
                ques.control !== undefined &&
                ques.control.appearance !== undefined &&
                ques.control.appearance.includes('searchDB')
            ) {
                properties.push([questionPath, pickSearchDBVariable(ques.control.appearance)]);
            }
            if (ques.type === 'group' || ques.type === 'survey') {
                const result = getSearchDBProperties(ques, questionPath);
                properties = properties.concat(result);
            }
        }
    }
    return properties;
};

function Form(props: formProps) {
    const [formDefinition, setFormDefinition] = useState<any>(null);
    const [formDefinitionJson, setFormDefinitionJson] = useState<any>(null);
    const [formChoices, setFormChoices] = useState<any>(null);
    const [toastVisible, setToastVisible] = useState<boolean>(false);
    const [userLocationInfo, setUserLocationInfo] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
    const [userInput, setUserInput] = useState<any>(null);

    useEffect(() => {
        const formId = (props as any).match.params.id || '';
        const formDefinitionObj = ipcRenderer.sendSync('fetch-form-definition', formId);
        const userLocationInfoObj = ipcRenderer.sendSync('user-db-info');
        const userInfoObj = ipcRenderer.sendSync('fetch-userlist');
        if (formDefinitionObj != null) {
            const { definition, formChoices } = formDefinitionObj;
            setFormDefinition(definition);
            setFormChoices(formChoices);
            setUserLocationInfo(userLocationInfoObj);
            logger.info(JSON.stringify(userLocationInfo));
            setUserInfo(userInfoObj);
        }
    }, []);

    useEffect(() => {
        setFormDefinitionJson(formDefinition ? removeGeoLocationFields(JSON.parse(formDefinition)) : null);
    }, [formDefinition]);

    const getUserInput = (dataJson: any) => {
        logger.info(' getUserInput ');
        let userInput = dataJson && typeof dataJson === 'string' ? JSON.parse(atob(dataJson)) : {};

        const userInputProperties = getSearchDBProperties(JSON.parse(formDefinition), '');
        if (userInputProperties.length > 0) {
            for (const prop of userInputProperties) {
                userInput = {
                    ...userInput,
                    [prop[0].slice(1)]: userLocationInfo[prop[1].split('@')[1]],
                };
            }
        }
        return userInput;
    };

    const generateUid = () => {
        return ((1e7).toString() + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
        );
    };

    const handleYes = () => {
        logger.info(' handleYes ');
        if (userInput && userInput !== 'Field Violated' && userInput !== 'submitted') {
            let inputJson = null;
            if (typeof userInput === 'object') {
                inputJson = userInput;
            } else if (typeof userInput === 'string') {
                // decode if needed
                inputJson = JSON.parse(atob(userInput));
            }
            const metaId =
                inputJson !== null &&
                !(
                    inputJson['meta/instanceID'] === null ||
                    inputJson['meta/instanceID'] === undefined ||
                    inputJson['meta/instanceID'] === ''
                )
                    ? inputJson['meta/instanceID']
                    : `${userInfo.users[0].username}-${generateUid()}`;
            const formId = (props as any).match.params.id || '';
            ipcRenderer.send('submit-form-response', {
                data: JSON.stringify({ ...userInput, 'meta/instanceID': metaId }),
                formId,
            });
            setToastVisible(true);
            setShowConfirmDialog(false);
            (props as any).history.push('/menu/');
            props.setUnsyncCount();
        }
    };

    const handleCancel = () => {
        logger.info('handleCancel');
        setShowConfirmDialog(false);
    };

    const handleSubmit = (userInput: any) => {
        logger.info(' handleSubmit ');
        setUserInput(userInput);
        setShowConfirmDialog(true);
    };

    const removeGeoLocationFields = (formDefinitionJson: any) => {
        logger.info('removeGeoLocationFields');
        const formDefinitionChildren = formDefinitionJson['children'];
        let questionsToDelete: number[] = [];
        for (const section in formDefinitionChildren) {
            if (formDefinitionChildren[section]['name'] === 'basic_info') {
                const basicInfoQuestions = formDefinitionChildren[section]['children'];
                for (let question = 0; question < basicInfoQuestions.length; question++) {
                    if (basicInfoQuestions[question]['name'] === 'division') {
                        questionsToDelete.push(question);
                    }
                    if (basicInfoQuestions[question]['name'] === 'district') {
                        questionsToDelete.push(question);
                    }
                    if (basicInfoQuestions[question]['name'] === 'upazila') {
                        questionsToDelete.push(question);
                    }
                    if (basicInfoQuestions[question]['name'] === 'mouza') {
                        questionsToDelete.push(question);
                    }
                }
                questionsToDelete = questionsToDelete.sort((a, b) => b - a);
                logger.info(questionsToDelete);
                for (const question in questionsToDelete) {
                    delete basicInfoQuestions[questionsToDelete[question]];
                }
                formDefinitionJson['children'][section]['children'] = basicInfoQuestions;
            }
        }
        return formDefinitionJson;
    };

    const { dataJson } = queryString.parse((props as any).location.search);

    const odk_props = {
        csvList: formChoices ? JSON.parse(formChoices) : {},
        defaultLanguage: props.appLanguage,
        formDefinitionJson: formDefinitionJson || {},
        handleSubmit,
        languageOptions: [
            {
                label: 'English',
                value: 'English',
            },
            {
                label: 'Bangla',
                value: 'Bangla',
            },
        ],
        userInputJson: userInput || getUserInput(dataJson),
    };

    const getOdkFormRenderer = () => {
        logger.info('odk props: ', odk_props);
        try {
            return <OdkFormRenderer {...odk_props} />;
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="form-container">
            <AlertDialog open={showConfirmDialog} yes={handleYes} cancel={handleCancel} />
            {toastVisible && <Alert color="success">Form Submitted Successfylly!</Alert>}
            {formDefinitionJson ? (
                getOdkFormRenderer()
            ) : (
                <div style={{ marginTop: '10%' }}>
                    <Typography color="secondary" component="h1" variant="h4" align="center">
                        Form is loading. If form does not render please Sync Now and then press Back and try again.
                    </Typography>
                </div>
            )}
        </div>
    );
}

export default withRouter(Form);
