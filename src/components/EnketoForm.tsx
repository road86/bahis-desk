import React, { useEffect, useRef, useState } from 'react';
import { log } from '../helpers/log';
import { Form } from 'enketo-core';
import { transform } from 'enketo-transformer/web';
import { Button } from '@material-ui/core';
import './theme-kobo.css';

interface EnketoFormProps {
    formODKXML: string; // The XML string of the form
    intialFormData?: string; // Optional initial data for the form in XML format
    setFormData: (data: string | null) => void; // Callback to set the form data on submission
}

export const EnketoForm: React.FC<EnketoFormProps> = ({ formODKXML, initialFormData, setFormData }) => {
    const formEl = useRef<HTMLDivElement>(null);
    const [formEnketoXML, setFormEnketoXML] = useState<string>('');
    const [formEnketoHTML, setFormEnketoHTML] = useState<string>('');
    const [form, setForm] = useState<Form | null>(null); // make forkm equals useRef?

    useEffect(() => {
        // when the component mounts, transform the form ODK XML to enketo XML and HTML
        if (!formODKXML) return;

        log.info('Transforming form ODK XML to enketo XML and HTML');
        transform({
            xform: formODKXML,
            media: {},
            openclinica: 0,
            markdown: true,
            theme: 'kobo',
        })
            .then((result) => {
                setFormEnketoHTML(result.form);
                setFormEnketoXML(result.model);
                log.info('Form HTML and XML generated successfully');
            })
            .catch((error) => {
                log.error('Error transforming form ODK XML to enketo XML and HTML:');
                log.error(error);
            });
    }, [formODKXML]);

    useEffect(() => {
        // when the Enketo HTML is generated, inject it into the form container
        if (!formEnketoHTML) return;
        if (formEl.current === null) return;

        formEl.current.innerHTML = formEnketoHTML;
    }, [formEl, formEnketoHTML]);

    useEffect(() => {
        // when the Enketo HTML and XML are generated, create the Enketo Form object
        if (!formEnketoHTML) return;
        if (!formEnketoXML) return;
        log.info(formEnketoXML);

        const data = {
            modelStr: formEnketoXML,
            instanceStr: null,
        };

        const options = {};

        setForm(new Form(formEl.current, data, options));
    }, [formEnketoHTML, formEnketoXML, initialFormData]);

    useEffect(() => {
        // when the Enketo Form object is created, init the form
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
                        log.info('Enketo form validated successfully');
                    } else {
                        log.error('Enketo form validation failed');
                    }
                })
                .catch((error) => {
                    log.error('Error validating Enketo form:', error?.message);
                });
            const data = form.getDataStr();
            log.debug(data);
            setFormData(data);
        }
    };

    const onReset = () => {
        if (form) {
            form.resetView();
            setFormData(null);
        }
    };

    return (
        <>
            <div ref={formEl}></div>
            {/* <div ref={formRef} dangerouslySetInnerHTML={{ __html: formEnketoHTML }}></div> */}
            <Button onClick={onReset}>Reset</Button>
            <Button onClick={onSubmit}>Submit</Button>
        </>
    );
};
