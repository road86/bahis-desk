import { Typography } from '@mui/material';
import { DataGrid, GridColDef, GridColumnVisibilityModel, GridToolbar } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { log } from '../helpers/log';
import { ipcRenderer } from '../services/ipcRenderer';
import { useNavigate, useParams } from 'react-router-dom';
import { readFormData } from '../helpers/form';

const GROUPS_TO_SHOW = ['basic_info'];
const FIELDS_TO_HIDE = ['division', 'district', 'upazila']; // TODO move out to some sort of config

const parseSubmissionsAsRows = (submission) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(submission.xml, 'text/xml');

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
    log.info('parsing form definition as datagrid columns');

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
    const parsedColumns = fields.map((element) => {
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

interface ListProps {
    draft?: boolean;
}

export const List: React.FC<ListProps> = ({ draft }) => {
    const [tableName, setTableName] = useState<string>();
    const [form, setForm] = useState<Document>();
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>();
    const [rows, setRows] = useState<[]>([]);

    const { form_uid } = useParams();
    const navigate = useNavigate();

    const readForm = (form_uid: string) => {
        log.info(`reading XML definition from form for form: ${form_uid}`);
        const query = `SELECT xml FROM form WHERE uid IS '${form_uid}'`;
        const parser = new DOMParser();
        ipcRenderer
            .invoke('get-local-db', query)
            .then((response) => {
                const xmlDoc = parser.parseFromString(response[0]?.xml, 'text/xml');
                setForm(xmlDoc);
            })
            .catch((error) => {
                log.error(`Error reading form definition: ${error}`);
            });
    };

    // decide which data table to read from, e.g. local or cloud submissions
    useEffect(() => {
        if (draft) {
            setTableName('formlocaldraft');
        } else {
            setTableName('formcloudsubmission');
        }
    }, [draft]);

    // read form defintion
    useEffect(() => {
        if (form_uid) {
            readForm(form_uid);
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
        if (form_uid && tableName) {
            const data = readFormData(tableName, form_uid);
            const jsonData = data.map((datum) => parseSubmissionsAsRows(datum));
            setRows(jsonData);
        }
    }, [form_uid, tableName]);

    const onRowClick = (event) => {
        log.debug(`row clicked: ${event.row.id}`);
        if (draft) {
            navigate(`/form/draft/${form_uid}/${event.row.id}`);
        } else {
            navigate(`/form/details/${form_uid}/${event.row.id}`);
        }
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

List.defaultProps = {
    draft: false,
};
