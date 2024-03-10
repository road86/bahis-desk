import { Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { log } from '../helpers/log';
import { ipcRenderer } from '../services/ipcRenderer';
import { useNavigate } from 'react-router-dom';

const readDraftTableData = async () => {
    log.info(`reading data from formlocaldraft table...`);
    const query = `SELECT * FROM formlocaldraft`;
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

const parseSubmissionsAsRows = (submissions) => {
    const parser = new DOMParser();

    const rows: any[] = [];

    for (const submission of submissions) {
        const xmlDoc = parser.parseFromString(submission.xml, 'text/xml');

        const uuid = xmlDoc.documentElement.getElementsByTagName('uuid')[0].textContent;

        const instance_start = new Date(xmlDoc.documentElement.getElementsByTagName('start')[0].textContent as string);

        const query = `SELECT name FROM form WHERE uid='${xmlDoc.documentElement.tagName}'`;
        const { form_uid, form_name } = ipcRenderer.invoke('get-local-db', query).then((response) => {
            ({ form_uid: response[0].uid, form_name: response[0].name });
        });

        const row = {
            id: uuid,
            form_uid: form_uid,
            form_name: form_name,
            instance_start: instance_start,
        };

        rows.push(row);
    }

    return rows;
};

export const DraftList = () => {
    const [rows, setRows] = useState<any[]>();

    const navigate = useNavigate();

    const columns: GridColDef[] = [
        {
            field: 'form_name',
            headerName: 'Form name',
            width: 200,
        },
        {
            field: 'instance_start',
            headerName: 'Created at',
            width: 200,
        },
    ];

    // read form defintion
    useEffect(() => {
        readDraftTableData().then((response) => {
            setRows(parseSubmissionsAsRows(response));
        });
    }, []);

    const onRowClick = (event) => {
        log.debug(`row clicked: ${event.row.id}`);
        navigate(`/form/draft/${event.row.form_uid}/${event.row.id}`);
    };

    return (
        <>
            <Typography variant="h3" id="form-title">
                Draft Submissions
            </Typography>
            {columns && rows && <DataGrid columns={columns} rows={rows} logger={log} onRowClick={onRowClick} autoHeight />}
        </>
    );
};
