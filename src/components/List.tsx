import { Typography } from '@mui/material';
import { DataGrid, GridColDef, GridColumnVisibilityModel, GridToolbar } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { log } from '../helpers/log';
import { ipcRenderer } from '../services/ipcRenderer';
import { useNavigate, useParams } from 'react-router-dom';

const GROUPS_TO_SHOW = ['basic_info'];

const readFormDefinition = async (form_uid: string) => {
    log.info(`reading XML definition from form for form: ${form_uid}`);
    const query = `SELECT xml FROM form WHERE uid IS '${form_uid}'`;
    const parser = new DOMParser();
    return ipcRenderer
        .invoke('get-local-db', query)
        .then((response) => {
            return parser.parseFromString(response[0]?.xml, 'application/xml');
        })
        .catch((error) => {
            log.error(`Error reading form definition: ${error}`);
            return undefined;
        });
};

const readFormData = async (form_uid: string, instance_id?: string) => {
    log.info(`reading data from formcloudsubmission table for form_uid: ${form_uid}`);
    if (instance_id) log.info(`  for instance_id: ${instance_id}...`);
    let query = `SELECT * FROM formcloudsubmission WHERE form_uid IS '${form_uid}'`;
    if (instance_id) query += ` AND uuid IS '${instance_id}'`;
    return ipcRenderer
        .invoke('get-local-db', query)
        .then((response) => {
            log.info(`Succesfully read ${response.length} records`);
            return response;
        })
        .catch((error) => {
            log.error(`Error reading form data from DB: ${error}`);
            return undefined;
        });
};


const parseSubmissionsAsRows = (submission) => {
    log.info('Parsing form data submissions as datagrid rows');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(submission.xml, 'application/xml');

    const form = xmlDoc.documentElement.children;

    const recurseXML = (collection: HTMLCollection, fields: Element[]) => {
        for (const element of collection) {
            if (element.childElementCount > 0) {
                recurseXML(element.children, fields);
            } else {
                fields.push(element);
            }
        }
    };

    // Get list of all fields in the form (recursing through groups and repeats)
    const fields: Element[] = [];
    recurseXML(form, fields);

    // Map fields to a row object
    const row = {};
    fields
        .filter((element) => {
            const parent_name = element.parentElement?.nodeName || '';
            const name = element.nodeName || '';
            if (GROUPS_TO_SHOW.includes(parent_name) && !FIELDS_TO_HIDE.includes(name)) {
                return true;
            } else {
                return false;
            }
        })
        .map((element) => {
            const parent_name = element.parentElement?.nodeName || '';
            const name = element.nodeName || '';
            const field_name = `${parent_name}_${name}`;
            const value = element.textContent || '';
            row[field_name] = value;
        });

    row['id'] = submission.uuid;
    return row;
};

const parseFormDefinitionAsColumns = (xmlDoc: Document) => {
    log.info('Parsing form definition as datagrid columns');

    const form = xmlDoc.body.children;

    const recurseXML = (collection: HTMLCollection, fields: Element[]) => {
        for (const element of collection) {
            if (element.nodeName === 'group' || element.nodeName === 'repeat') {
                recurseXML(element.children, fields);
            } else if (element.nodeName === 'input') {
                fields.push(element);
            }
        }
    };

    // Get list of all fields in the form (recursing through groups and repeats)
    const fields: Element[] = [];
    recurseXML(form, fields);

    const columnVisibilityInitial = {};
    fields.filter((element) => {
        const ref = element.getAttribute('ref');
        const parent_name = ref?.split('/')[2] || '';
        const name = ref?.split('/')[3] || '';
        if (GROUPS_TO_SHOW.includes(parent_name) && !FIELDS_TO_HIDE.includes(name)) {
            columnVisibilityInitial[`${parent_name}_${name}`] = true;
        } else {
            columnVisibilityInitial[`${parent_name}_${name}`] = false;
        }
    });

    // Map fields to column definition objects
    const parsedColumns: GridColDef[] = fields.map((element) => {
        const ref = element.getAttribute('ref');
        const parent_name = ref?.split('/')[2] || '';
        const name = ref?.split('/')[3] || '';
        const headerName = element.getElementsByTagName('label')[0].textContent;
        return {
            field: `${parent_name}_${name}`,
            headerName: headerName || name,
            width: 200,
        };
    });

    return { parsedColumns, columnVisibilityInitial };
};

export const List = () => {
    const [form, setForm] = useState<Document>();
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>();
    const [rows, setRows] = useState<[]>([]);

    const { form_uid } = useParams();
    const navigate = useNavigate();

    // read form definition
    useEffect(() => {
        if (form_uid) {
            readFormDefinition(form_uid).then((xmlDoc) => {
                setForm(xmlDoc);
            });
        }
    }, [form_uid]);

    // parse form definition into columns
    useEffect(() => {
        if (form) {
            const { parsedColumns, columnVisibilityInitial } = parseFormDefinitionAsColumns(form);
            setColumns(parsedColumns);
            setColumnVisibility(columnVisibilityInitial);
        }
    }, [form]);

    // parse data as rows
    useEffect(() => {
        if (form_uid) {
            readFormData(form_uid)
                .then((data) => {
                    const jsonData = data.map((datum) => parseSubmissionsAsRows(datum));
                    setRows(jsonData);
                })
                .catch((error) => {
                    log.error(`Error reading form data: ${error}`);
                });
        }
    }, [form_uid]);

    const onRowClick = (event) => {
        log.debug(`row clicked: ${event.row.id}`);
        navigate(`/form/details/${form_uid}/${event.row.id}`);
    };

    return (
        <>
            <Typography variant="h3" id="form-title">
                {form?.title}
            </Typography>
            {columns && rows && (
                <DataGrid
                    columns={columns}
                    columnVisibilityModel={columnVisibility}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibility(newModel)}
                    rows={rows}
                    slots={{ toolbar: GridToolbar }}
                    logger={log}
                    onRowClick={onRowClick}
                    autoHeight
                />
            )}
        </>
    );
};
