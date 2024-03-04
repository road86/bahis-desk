import { useEffect, useState } from 'react';
import { RouteComponentProps, useParams, withRouter } from 'react-router-dom';
import { log } from '../helpers/log';
import { ipcRenderer } from '../services/ipcRenderer';
import { EnketoForm } from './EnketoForm';
import { Footer } from './Footer';
import { Loading } from './Loading';

interface FormURLParams {
    id: string;
}

interface formProps extends RouteComponentProps<FormURLParams> {
    setUnsyncCount: any;
    setSuccess: () => void;
}

export const Form = (props: formProps) => {
    const [formXML, setFormXML] = useState<string>('');
    const [tableName, setTableName] = useState<string>('');
    const [formData, setFormData] = useState<any>([]);

    const [isDeskUserReplaced, setIsDeskUserReplaced] = useState<boolean>(false);
    const [isDeskCSVInserted, setIsDeskCSVInserted] = useState<boolean>(false);

    const { form_id } = useParams();

    useEffect(() => {
        const readForm = (form_id: number) => {
            log.info(`reading XML definition from forms for form: ${form_id}`);
            const query = `SELECT xml FROM form WHERE uid = '${form_id}'`;
            const response = ipcRenderer.sendSync('fetch-query-data', query);
            if (response[0]?.xml) {
                setFormXML(response[0]?.xml);
                log.info('Form definition read successfully');
            }
        };

        if (form_id) {
            readForm(form_id);
        }
    }, [form_id]);

    useEffect(() => {
        log.info('Form definition changed');

        const replaceDeskUserValues = (formXML: string) => {
            log.info('Replacing deskUser tags in form definition');
            const parser = new DOMParser();
            const serializer = new XMLSerializer();

            const doc = parser.parseFromString(formXML, 'application/xml');

            const elements = doc.getElementsByTagName('*');

            let hasReplacements = false;
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].textContent?.startsWith('deskUser')) {
                    switch (elements[i].textContent) {
                        case 'deskUser.administrative_region_1':
                            elements[i].textContent = 'Dhaka';
                            hasReplacements = true;
                            break;
                        case 'deskUser.administrative_region_2':
                            elements[i].textContent = 'Tangail';
                            hasReplacements = true;
                            break;
                        case 'deskUser.administrative_region_3':
                            elements[i].textContent = 'Ghatail';
                            hasReplacements = true;
                            break;
                        default:
                            // FIXME make this dynamic based on the user
                            break;
                    }
                }
            }

            if (hasReplacements) {
                setFormXML(serializer.serializeToString(doc));
                log.info('deskUser tags replaced successfully');
            } else {
                log.info('No deskUser tags found');
                setIsDeskUserReplaced(true);
                return;
            }
        };

        const readDeskCSVChoices = (taxonomySlug: string) => {
            log.info(`Reading taxonomy data for ${taxonomySlug}`);
            const parser = new DOMParser();

            // TODO move this part into read-taxonomy-data?
            const query = `SELECT csv_file FROM taxonomy where slug = '${taxonomySlug}'`;
            const response = ipcRenderer.sendSync('fetch-query-data', query);
            const csv_file = response[0]?.csv_file;

            return ipcRenderer
                .invoke('read-taxonomy-data', csv_file)
                .then((data: string) => {
                    log.info(typeof data);
                    return parser.parseFromString(data, 'application/xml').documentElement;
                })
                .catch((error) => {
                    log.error('Error reading taxonomy data');
                    log.error(error);
                });
        };

        const insertDeskCSVChoices = async (formXML: string) => {
            log.info('Inserting deskCSV choices in form definition');
            const parser = new DOMParser();
            const serializer = new XMLSerializer();

            const doc = parser.parseFromString(formXML, 'application/xml');
            const elements = doc.getElementsByTagName('*');

            let hasReplacements = false;
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].tagName === 'instance' && elements[i].getAttribute('id')?.startsWith('deskCSV')) {
                    log.info(`Found deskCSV tag ${elements[i].getAttribute('id')}`);
                    if (elements[i].getAttribute('id') === 'deskCSV.administrative-region') {
                        log.info('Reading administrative region data');
                        const query =
                            'SELECT id AS name, title AS label, administrative_region_level AS administrative_region_level FROM administrativeregion';
                        const response = ipcRenderer.sendSync('fetch-query-data', query);
                        const administrativeRegionData = response;

                        const administrativeRegionXML = `<root>${administrativeRegionData
                            .map((row: any) => {
                                return `<item><name>${row.name}</name><label>${row.label}</label><administrative_region_level>${row.administrative_region_level}</administrative_region_level></item>`;
                            })
                            .join('')}</root>`;
                        const administrativeRegionDoc = parser.parseFromString(administrativeRegionXML, 'application/xml');
                        elements[i].replaceChildren(administrativeRegionDoc.documentElement);
                        elements[i].setAttribute('id', 'administrative-region');

                        for (let i = 0; i < elements.length; i++) {
                            if (
                                elements[i].tagName === 'itemset' &&
                                elements[i].getAttribute('nodeset')?.startsWith('instance')
                            ) {
                                const nodeset = elements[i].getAttribute('nodeset');
                                if (nodeset && nodeset.includes('deskCSV.administrative-region')) {
                                    const newNodeset = nodeset?.replace('deskCSV.', '');
                                    elements[i].setAttribute('nodeset', newNodeset);
                                }
                            }
                        }
                    } else {
                        const taxonomySlug = elements[i].getAttribute('id')?.slice(8);
                        if (taxonomySlug) {
                            const taxonomyData = await readDeskCSVChoices(taxonomySlug);
                            if (taxonomyData) {
                                elements[i].replaceChildren(taxonomyData);
                                elements[i].setAttribute('id', taxonomySlug);
                                for (let i = 0; i < elements.length; i++) {
                                    if (
                                        elements[i].tagName === 'itemset' &&
                                        elements[i].getAttribute('nodeset')?.startsWith('instance')
                                    ) {
                                        const nodeset = elements[i].getAttribute('nodeset');
                                        if (nodeset && nodeset.includes(taxonomySlug)) {
                                            const newNodeset = nodeset?.replace('deskCSV.', '');
                                            elements[i].setAttribute('nodeset', newNodeset);
                                        }
                                    }
                                }
                                hasReplacements = true;
                                log.info(`Taxonomy data choices for ${taxonomySlug} inserted successfully`);
                            }
                        }
                    }
                }
            }

            if (hasReplacements) {
                setFormXML(serializer.serializeToString(doc));
                log.info('deskCSV choices replaced successfully');
            } else {
                log.info('No deskCSV tags found');
                setIsDeskCSVInserted(true);
            }
        };

        if (formXML) {
            replaceDeskUserValues(formXML);
            insertDeskCSVChoices(formXML);
        }
    }, [formXML]);

    return (
        <>
            {form_id && formXML && isDeskUserReplaced && isDeskCSVInserted ? (
                <EnketoForm formODKXML={formXML} setFormData={setFormData} />
            ) : (
                <Loading />
            )}
            <Footer />
        </>
    );
};
