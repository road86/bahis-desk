import React, { useEffect, useRef, useState } from 'react';
import { log } from '../helpers/log';
import { ipcRenderer } from 'electron';
import './theme-kobo.css';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from '../services/ipcRenderer';

interface EnketoFormProps {
    formUID: string; // The unique identifier for the form
    formODKXML: string; // The XML string of the form
    formData?: string; // Optional initial data for the form in XML format
    setFormData?: (data) => void; // Callback to set the form data on submission
    instanceID?: string; // The instance ID for a previously submitted form
    editable?: boolean; // Whether the form should be editable
}

export const EnketoForm: React.FC<EnketoFormProps> = ({
    formUID,
    formODKXML,
    formData,
    setFormData,
    instanceID,
    editable,
}) => {
    const formEl = useRef<HTMLDivElement>(null);
    const [formEnketoXML, setFormEnketoXML] = useState<string>('');
    const [formEnketoHTML, setFormEnketoHTML] = useState<string>('');
    const [form, setForm] = useState<Form | null>(null);

    const navigate = useNavigate();

    const createDraft = (data) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'application/xml');
        const uuid = doc.getElementsByTagName('instanceID')[0].textContent;
        const query = `INSERT INTO formlocaldraft (uuid, form_uid, xml) VALUES ('${uuid}', '${formUID}', '${data}')`;
        ipcRenderer
            .invoke('post-local-db', query)
            .then((response) => {
                if (response) {
                    log.info('Form draft added to local database successfully');
                }
            })
            .catch((error) => {
                log.error('Error adding form draft to local database:');
                log.error(error);
            });
    };

    // when the component mounts, transform the form ODK XML to enketo XML and HTML
    // checking whether or not the form should be editable
    // and converting the form to read-only if necessary
    useEffect(() => {
        if (!formODKXML) return;

        const convertToReadOnly = (formHTML: string) => {
            log.info('Converting all fields to read-only');
            const parser = new DOMParser();
            const serializer = new XMLSerializer();

            const doc = parser.parseFromString(formHTML, 'text/html');

            // convert all elements to read-only
            const elements = doc.querySelectorAll(
                '.question input:not([readonly]), .question textarea:not([readonly]), .question select:not([readonly])',
            );
            for (let i = 0; i < elements.length; i++) {
                elements[i].setAttribute('readonly', 'readonly');
                elements[i].classList.add('readonly-forced');
            }

            // prevent add/remove of repeat instances
            const repeats = doc.querySelectorAll('.or-repeat-info');
            for (let i = 0; i < repeats.length; i++) {
                repeats[i].setAttribute('data-repeat-fixed', 'fixed');
            }

            const formHTMLReadyOnly = serializer.serializeToString(doc);
            log.info('All fields converted to read-only');
            return formHTMLReadyOnly;
        };

        log.info('Transforming form ODK XML to enketo XML and HTML');
        transform({
            xform: formODKXML,
            media: {},
            openclinica: 0,
            markdown: true,
            theme: 'kobo',
        })
            .then((result) => {
                setFormEnketoXML(result.model);
                if (!editable) {
                    setFormEnketoHTML(convertToReadOnly(result.form));
                } else {
                    setFormEnketoHTML(result.form);
                }
                log.info('Form HTML and XML generated successfully');
            })
            .catch((error) => {
                log.error('Error transforming form ODK XML to enketo XML and HTML:');
                log.error(error);
            });
    }, [formODKXML, editable]);

    // when the Enketo HTML is generated, inject it into the form container
    useEffect(() => {
        if (!formEnketoHTML) return;
        if (formEl.current === null) return;

        formEl.current.innerHTML = formEnketoHTML;
    }, [formEl, formEnketoHTML]);

    // when the Enketo HTML and XML are generated, create the Enketo Form object
    useEffect(() => {
        if (!formEnketoHTML) return;
        if (!formEnketoXML) return;

        const data = {
            modelStr: formEnketoXML,
            instanceStr: formData || null,
            submitted: instanceID !== undefined,
            session: {
                username: 'ghatail', // FIXME make not hardcoded
            },
        };

        const options = {};

        setForm(new Form(formEl.current?.children[0], data, options));
    }, [formEnketoHTML, formEnketoXML, formData, instanceID]);

    // when the Enketo Form object is created, init the form
    useEffect(() => {
        try {
            const loadErrors = form.init();
            log.info('Enketo form initialized successfully');
            log.warn('Load errors:');
            log.warn(loadErrors);
        } catch (error) {
            log.error('Error initializing Enketo form:');
            log.error(error);
        }
    }, [form]);

    const onSubmit = () => {
        if (form) {
            form.validate()
                .then((valid) => {
                    if (valid) {
                        log.info('Enketo form validation successful');
                        const data = form.getDataStr();
                        // log.debug(data);
                        if (data) {
                            createDraft(data);
                            navigate(-1);
                        }
                    } else {
                        log.error('Enketo form validation failed');
                    }
                })
                .catch((error) => {
                    log.error('Error validating Enketo form:');
                    log.error(error);
                });
        }
    };

    const onReset = () => {
        if (form) {
            form.resetView();
            if (setFormData) setFormData(null);
        }
    };

    return (
        <>
            <div ref={formEl}></div>
            {editable && (
                <>
                    <Button onClick={onReset}>Reset</Button>
                    <Button onClick={onSubmit}>Submit</Button>
                </>
            )}
        </>
    );
};

EnketoForm.defaultProps = {
    editable: true,
};
