import { Container, Typography } from '@material-ui/core';
import { DataGrid, GridColDef } from '@material-ui/data-grid';
import { useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { logger } from '../../helpers/logger';
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
        logger.info('parsing form definition as datagrid columns');
        const mappedColumns = form?.children
            .filter((field: any) => {
                if (field.name === 'basic_info') {
                    return true;
                } else if (
                    prefix === 'basic_info_' &&
                    (field.name === 'division' ||
                        field.name === 'district' ||
                        field.name === 'upazila' ||
                        field.name === 'union' ||
                        field.name === 'mouza')
                ) {
                    return false;
                } else if (prefix === 'basic_info_') {
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
                        editable: false,
                    };
                }
            });
        // flatten mapped columns
        if (mappedColumns) {
            const flattenedColumns = mappedColumns.flat();
            logger.info(JSON.stringify(flattenedColumns));
            return flattenedColumns;
        }
    };

    const readForm = (form_id: any = null) => {
        logger.info(`reading definition from forms for form_id: ${form_id}`);
        const query = `SELECT definition FROM forms WHERE form_id IS ${form_id}`;
        const response = ipcRenderer.sendSync('fetch-query-data', query);
        const parsed_response = JSON.parse(response[0]?.definition || '');
        setForm(parsed_response);
        setTableName(`bahis_${parsed_response.name}_table`);
    };

    const readData = (tableName: any = null) => {
        logger.info(`reading data from table: ${tableName}`);
        const query = `SELECT * FROM ${tableName}`;
        return ipcRenderer.sendSync('fetch-query-data', query);
    };

    useEffect(() => {
        readForm(props.id);
    }, []);

    useEffect(() => {
        const data = readData(tableName);
        setRows(data);
    }, [tableName, form]);

    useEffect(() => {
        const parsedColumns = parseFormDefinitionAsColumns(form);
        setColumns(parsedColumns);
    }, [form]);

    return (
        <Container maxWidth={false} style={{ marginTop: '20px' }}>
            <Typography variant="h3">{form?.title}</Typography>
            {columns && rows && <DataGrid columns={columns} rows={rows} logger={logger} pageSize={15} autoHeight />}
        </Container>
    );
}

export default withRouter(List);
