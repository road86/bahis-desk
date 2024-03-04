import { Container, Typography } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { RouteComponentProps, useParams, withRouter } from 'react-router-dom';
import { log } from '../../helpers/log';
import { ipcRenderer } from '../../services/ipcRenderer';

import { EnketoForm } from '../EnketoForm';
import { Footer } from '../Footer';
interface DetailsURLParams {
    id: string;
}

function FormDetails(props: RouteComponentProps<DetailsURLParams>) {
    const [form, setForm] = useState<any>(null);
    const [tableName, setTableName] = useState<string>('');
    const [formData, setFormData] = useState<any>([]);

    const { form_id, id } = useParams();

    const searchDB = (form: string) => {
        log.info('Parsing custom tags in form definition');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(form, 'text/xml');
        log.info('xmlDoc: ' + xmlDoc.body.childElementCount);
        for (const element of xmlDoc.body.children) {
            const elementType = element.tagName;
            if (elementType === 'group') {
                log.info('Recursing into group: ' + element.getAttribute('ref'));
                for (const child of element.children) {
                    const appearance = child.getAttribute('appearance');
                    log.info('appearance: ' + appearance);
                }
            } else {
                const appearance = element.getAttribute('appearance');
                log.info('appearance: ' + appearance);
            }
        }
        return form;
    };

    const readForm = (form_id: number) => {
        log.info(`reading XML definition from forms for form: ${form_id}`);
        const query = `SELECT xml, json FROM forms2 WHERE id IS ${form_id}`;
        const response = ipcRenderer.sendSync('fetch-query-data', query);
        if (response[0]?.xml) {
            const updated_form = searchDB(response[0]?.xml);
            setForm(updated_form);
        }
        const parsed_response = JSON.parse(response[0]?.json || []);
        setTableName(`bahis_${parsed_response.name}_table`);
    };

    const readData = (tableName: string, id: number) => {
        log.info(`reading data from table: ${tableName}`);
        const query = `SELECT DISTINCT * FROM ${tableName} WHERE id = ${id}`;
        return ipcRenderer.sendSync('fetch-query-data', query);
    };

    useEffect(() => {
        readForm(form_id);
    }, [form_id]);

    useEffect(() => {
        const data = readData(tableName, id);
        console.log(data);
        setFormData(data);
    }, [tableName]);

    return (
        <Container className="or" maxWidth={false} style={{ marginTop: '20px' }}>
            <Typography variant="h3">{form?.title} Details</Typography>
            {form && <EnketoForm formXml={form} />}
            <Footer />
        </Container>
    );
}

export default withRouter(FormDetails);
