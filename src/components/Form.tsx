import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { log } from '../helpers/log';
import { ipcRenderer } from '../services/ipcRenderer';
import { EnketoForm } from './EnketoForm';
import { Footer } from './EnketoFooter';
import { Loading } from './Loading';

const readFormData = async (tableName: string, form_uid: string, instance_id?: string) => {
    log.info(`reading data from ${tableName} table...`);
    log.info(`  for form_uid: ${form_uid}...`);
    if (instance_id) log.info(`  for instance_id: ${instance_id}...`);
    let query = `SELECT * FROM ${tableName} WHERE form_uid IS '${form_uid}'`;
    if (instance_id) query += ` AND uuid IS '${instance_id}'`;
    return ipcRenderer
        .invoke('get-local-db', query)
        .then((response) => {
            log.info(`  read ${response.length} records`);
            return response;
        })
        .catch((error) => {
            log.error(`Error reading form data: ${error}`);
            return [];
        });
};

interface FormProps {
    draft?: boolean;
}

export const Form: React.FC<FormProps> = ({ draft }) => {
    const [formXML, setFormXML] = useState<string>('');
    const [tableName, setTableName] = useState<string>('');
    const [formData, setFormData] = useState<string>();
    const [editable, setEditable] = useState<boolean>(true);

    const [isDeskUserReplaced, setIsDeskUserReplaced] = useState<boolean>(false);
    const [isDeskTaxonomyInserted, setIsDeskTaxonomyInserted] = useState<boolean>(false);

    const { form_uid, instance_id } = useParams();

    // decide which data table to read from, e.g. submitted or cloud
    useEffect(() => {
        log.info('Deciding which data table to read from');
        if (draft) {
            setTableName('formlocaldraft');
        } else {
            setTableName('formcloudsubmission');
        }
    }, [draft]);

    // if the form has been filled out previously, do we want to allow editing?
    useEffect(() => {
        if (!draft && instance_id) {
            log.info('This is a cloud form, blocking editing.');
            setEditable(false);
        }
    }, [draft, instance_id]);

    // read form defintion
    useEffect(() => {
        const readForm = (form_uid: string) => {
            log.info(`reading XML definition from forms for form: ${form_uid}`);
            const query = `SELECT xml FROM form WHERE uid = '${form_uid}'`;
            ipcRenderer
                .invoke('get-local-db', query)
                .then((response) => {
                    if (response[0]?.xml) {
                        setFormXML(response[0]?.xml);
                        log.info('Form XML definition read successfully');
                    }
                })
                .catch((error) => {
                    log.error('Error reading form XML definition');
                    log.error(error);
                });
        };

        if (form_uid) {
            readForm(form_uid);
        }
    }, [form_uid]);

    // replace deskUser and deskChoice tags in form definition
    useEffect(() => {
        log.info('Form definition changed');

        const replaceUserValues = (formXML: string) => {
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

        const readTaxonomyChoices = (taxonomySlug: string) => {
            log.info(`Reading taxonomy data for ${taxonomySlug}`);
            const parser = new DOMParser();

            if (taxonomySlug === 'administrative_region') {
                return ipcRenderer
                    .invoke('read-administrative-region-data')
                    .then((data: string) => {
                        return parser.parseFromString(data, 'application/xml');
                    })
                    .catch((error) => {
                        log.error('Error reading administrative region data data');
                        log.error(error);
                    });
            } else {
                return ipcRenderer
                    .invoke('read-taxonomy-data', taxonomySlug)
                    .then((data: string) => {
                        return parser.parseFromString(data, 'application/xml');
                    })
                    .catch((error) => {
                        log.error('Error reading taxonomy data');
                        log.error(error);
                    });
            }
        };

        const insertTaxonomyChoices = async (formXML: string) => {
            log.info('Inserting deskTaxonomy choices in form definition');
            const parser = new DOMParser();
            const serializer = new XMLSerializer();

            const doc = parser.parseFromString(formXML, 'application/xml');
            const elements = doc.getElementsByTagName('*');

            let hasReplacements = false;
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].tagName === 'instance' && elements[i].getAttribute('id')?.startsWith('deskTaxonomy')) {
                    log.info(`Found deskTaxonomy tag ${elements[i].getAttribute('id')}`);
                    let choiceOptions: Document | null = null;
                    let taxonomySlug;

                    if (elements[i].getAttribute('id') === 'deskTaxonomy.administrative_region') {
                        taxonomySlug = 'administrative_region';
                    } else {
                        taxonomySlug = elements[i].getAttribute('id')?.slice('deskTaxonomy.'.length);
                    }

                    if (taxonomySlug) {
                        choiceOptions = await readTaxonomyChoices(taxonomySlug);
                    }

                    if (choiceOptions) {
                        log.debug(taxonomySlug);
                        log.debug(JSON.stringify(choiceOptions));
                        elements[i].replaceChildren(choiceOptions.documentElement);
                        elements[i].setAttribute('id', taxonomySlug);

                        for (let i = 0; i < elements.length; i++) {
                            if (
                                elements[i].tagName === 'itemset' &&
                                elements[i].getAttribute('nodeset')?.startsWith('instance')
                            ) {
                                const nodeset = elements[i].getAttribute('nodeset');
                                if (nodeset && nodeset.includes(`deskTaxonomy.${taxonomySlug}`)) {
                                    const newNodeset = nodeset?.replace('deskTaxonomy.', '');
                                    elements[i].setAttribute('nodeset', newNodeset);
                                }
                            }
                        }
                        hasReplacements = true;
                    }
                }
            }

            if (hasReplacements) {
                setFormXML(serializer.serializeToString(doc));
                log.info('deskTaxonomy choices replaced successfully');
            } else {
                log.info('No deskTaxonomy tags found');
                setIsDeskTaxonomyInserted(true);
            }
        };

        if (formXML) {
            if (!instance_id) {
                log.info('This appears to be a fresh form, replacing deskUser and deskTaxonomy tags.');
                replaceUserValues(formXML);
                insertTaxonomyChoices(formXML);
            } else {
                log.info('This appears to be an editable but filled-in form, only replacing deskTaxonomy tags.');
                setIsDeskUserReplaced(true);
                insertTaxonomyChoices(formXML);
            }
        }
    }, [formXML, instance_id]);

    // if the form has been filled out previously, read the data
    useEffect(() => {
        if (form_uid && tableName && instance_id) {
            log.info(`Reading data for form: ${form_uid} (${tableName}) and instance: ${instance_id}`);
            const data = readFormData(tableName, form_uid, instance_id)[0]['xml'] as string;
            setFormData(data);
        }
    }, [form_uid, tableName, instance_id]);

    return (
        <>
            {form_uid && formXML && isDeskUserReplaced && isDeskTaxonomyInserted ? (
                <EnketoForm
                    formUID={form_uid}
                    formODKXML={formXML}
                    formData={formData}
                    setFormData={setFormData}
                    instanceID={instance_id}
                    editable={editable}
                />
            ) : (
                <Loading />
            )}
            <Footer />
        </>
    );
};

Form.defaultProps = {
    draft: false,
};
