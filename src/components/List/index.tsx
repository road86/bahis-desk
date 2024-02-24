import { makeStyles, Typography, useTheme } from '@material-ui/core';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Filter from '../../containers/Filter';
import ListTable from '../../containers/ListTable';
import { getNativeLanguageText } from '../../helpers/utils';
import { ipcRenderer } from '../../services/ipcRenderer';
import { listPageStyles } from './style';
import { logger } from '../../helpers/logger';

export const FILTER_CHOICES = {
    sample_select_one: [{ name: 'Dhaka' }, { name: 'Chatrogram' }],
    sample_select_one_v1: [
        { name: 'Dhaka', sample_select_one: 'Dhaka' },
        { name: 'Chatrogram', sample_select_one: 'Chatrogram' },
    ],
    sample_select_multiple: [{ name: 'Dhaka' }, { name: 'Chatrogram' }],
    sample_select_multiple_v1: [
        { name: 'Dhaka', sample_select_multiple: 'Dhaka' },
        { name: 'Chatrogram', sample_select_multiple: 'Chatrogram' },
    ],
};
export type FILTER_CHOICES = typeof FILTER_CHOICES;

/** interface for Form URL params */
interface ListURLParams {
    id: string;
}

/** interface for List props */
interface ListProps extends RouteComponentProps<ListURLParams> {
    appLanguage: string;
}

function List(props: ListProps) {
    const [columnDefinition, setColumnDefinition] = React.useState<any>(null);
    const [filterDefinition, setFilterDefinition] = React.useState<any>(null);
    const [datasource, setDataSource] = React.useState<any>(null);
    const [filtersValue, setFilterValue] = React.useState<any>({});
    const [listHeader, setListHeader] = React.useState<{ [key: string]: string }>({});
    const [listId, setListId] = React.useState<string>('');

    const comUpdate = async () => {
        const { match } = props as any;
        const listId = match.params.id || '';
        logger.info('list id');
        logger.info(listId);
        const response = await ipcRenderer.sendSync('fetch-list-definition', listId);
        //Maybe this wont work with === ?
        if (response != null || response != undefined) {
            const { columnDefinition, filterDefinition, datasource, listHeader } = response;

            setDataSource(datasource ? JSON.parse(datasource) : null);
            setFilterDefinition(filterDefinition ? JSON.parse(filterDefinition) : null);
            setListHeader(listHeader ? JSON.parse(listHeader) : {});
            setColumnDefinition(columnDefinition ? JSON.parse(columnDefinition) : null);
            setListId(listId);
        }
    };

    React.useEffect(() => {
        comUpdate();
    }, []);

    const setFiltersValue = (filtersValue: any) => {
        setFilterValue(filtersValue);
    };

    const { appLanguage } = props;

    const theme = useTheme();
    const useStyles = makeStyles(listPageStyles(theme));
    const classes = useStyles();

    return (
        <>
            {columnDefinition && filterDefinition ? (
                <div>
                    <hr className={classes.hrTag} />
                    <div style={{ textAlign: 'center' }}>
                        <h3 className={classes.header}> {getNativeLanguageText(listHeader, appLanguage)} </h3>
                    </div>
                    <hr className={classes.hrTag} />
                    {filterDefinition && listId !== '' && (
                        <Filter
                            definition={filterDefinition}
                            choices={FILTER_CHOICES}
                            onSubmitHandler={setFiltersValue}
                            appLanguage={appLanguage}
                            listId={listId}
                            columnDefinition={columnDefinition}
                            datasource={datasource}
                        />
                    )}
                    {columnDefinition && datasource && (
                        <ListTable
                            listId={listId}
                            columnDefinition={columnDefinition}
                            datasource={datasource}
                            filters={filtersValue}
                        />
                    )}
                </div>
            ) : (
                <Typography color="secondary" component="h1" variant="h4" align="center" style={{ marginTop: '10%' }}>
                    Couldn't Find List Definition
                </Typography>
            )}
        </>
    );
}

export default withRouter(List);
