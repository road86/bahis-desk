import { Container, Typography } from '@material-ui/core';
import { DataGrid, GridColDef } from '@material-ui/data-grid';
import { useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { log } from '../../helpers/log';
import { ipcRenderer } from '../../services/ipcRenderer';

interface ListURLParams {
    id: string;
}

function List(props: RouteComponentProps<ListURLParams>) {
    const [tableName, setTableName] = useState<string>();
    const [form, setForm] = useState<any>(null);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [rows, setRows] = useState<[]>([]);

    const parseFormDefinitionAsColumns = (form: any = null, prefix = '') => {
        log.info('parsing form definition as datagrid columns');
        const mappedColumns = form?.children
            .filter((field: any) => {
                if (field.name === 'basic_info' || field.name === 'group_basic_information') {
                    return true;
                } else if (
                    (prefix === 'basic_info_' || prefix === 'group_basic_information_') &&
                    (field.name === 'division' ||
                        field.name === 'district' ||
                        field.name === 'upazila' ||
                        field.name === 'union' ||
                        field.name === 'mouza')
                ) {
                    return false;
                } else if (prefix === 'basic_info_' || prefix === 'group_basic_information_') {
                    return true;
                } else {
                    return false;
                }
            })
            .map((field: any) => {
                if (field.type === 'group') {
                    return parseFormDefinitionAsColumns(field, `${prefix}${field.name}_`);
                } else {
                    return {
                        field: `${prefix}${field.name}`,
                        headerName: field.label?.English || field.label?.Bangla || field.label || field.name,
                        width: 200,
                    };
                }
            });
        // flatten mapped columns
        if (mappedColumns) {
            const flattenedColumns = mappedColumns.flat();
            return flattenedColumns;
        }
    };

    const readForm = (form_id: any = null) => {
        log.info(`reading JSON definition from forms for form: ${form_id}`);
        const query = `SELECT json FROM forms2 WHERE id IS ${form_id}`;
        const response = ipcRenderer.sendSync('fetch-query-data', query);
        const parsed_response = JSON.parse(response[0]?.json || []);
        setForm(parsed_response);
        setTableName(`bahis_${parsed_response.name}_table`);
    };

    const readData = (tableName: any = null) => {
        log.info(`reading data from table: ${tableName}`);
        const query = `SELECT * FROM ${tableName}`;
        return ipcRenderer.sendSync('fetch-query-data', query);
    };

    useEffect(() => {
        readForm((props as any).match.params.id);
    }, [props]);

    useEffect(() => {
        const parsedColumns = parseFormDefinitionAsColumns(form);
        setColumns(parsedColumns);
    }, [form]);

    useEffect(() => {
        const data = readData(tableName);
        setRows(data);
    }, [tableName, form]);

    const onRowClick = (event) => {
        log.info(`row clicked: ${event.row.id}`);
        log.info(JSON.stringify(event.row));
        props.history.push(`/submittedDetails/${(props as any).match.params.id}/${event.row.id}`); // TODO implement and include workflow buttons
    };

    return (
        <Container maxWidth={false} style={{ marginTop: '20px' }}>
            <Typography variant="h3">{form?.title}</Typography>
            {columns && rows && (
                <DataGrid
                    columns={columns}
                    rows={rows}
                    logger={log}
                    rowsPerPageOptions={[15, 25, 50]}
                    pageSize={15}
                    onRowClick={onRowClick}
                    autoHeight
                />
            )}
        </Container>
    );
}

export default withRouter(List);
