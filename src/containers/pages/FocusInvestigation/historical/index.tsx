// this is the FocusInvestigation page component
import DrillDownTable from '@onaio/drill-down-table';
import * as React from 'react';
import { CellInfo } from 'react-table';
import HeaderBreadcrumb from '../../../../components/page/HeaderBreadcrumb/HeaderBreadcrumb';
import { getTableCellIndicator } from '../../../../helpers/indicators';
import { data } from './tests/fixtures';

/** Historical data reporting for Focus Investigation */
class HistoricalFocusInvestigation extends React.Component<{}, {}> {
  constructor(props: {}) {
    super(props);
  }

  public render() {
    // const ProgressCell =

    const tableProps = {
      className: 'table',
      columns: [
        {
          Header: 'Location',
          columns: [
            {
              Header: '',
              accessor: 'name',
            },
          ],
        },
        {
          Header: 'Mapped Foci Areas',
          columns: [
            {
              Header: 'Total',
              accessor: 'Total',
            },
            {
              Header: 'A1',
              accessor: 'A1',
            },
            {
              Header: 'A2',
              accessor: 'A2',
            },
            {
              Header: 'B1',
              accessor: 'B1',
            },
            {
              Header: 'B2',
              accessor: 'B2',
            },
          ],
        },
        {
          Header: 'A1 screened twice in last year',
          columns: [
            {
              Header: 'Number',
              accessor: 'Number',
            },
            {
              Cell: (cell: CellInfo) => getTableCellIndicator(cell),
              Header: '%',
              accessor: '%',
            },
          ],
        },
        {
          Header: 'FI response',
          columns: [
            {
              Cell: (cell: CellInfo) => getTableCellIndicator(cell),
              Header: 'adherence',
              accessor: 'Adherence',
            },
          ],
        },
      ],
      data,
      identifierField: 'name',
      linkerField: 'name',
      minRows: 0,
      parentIdentifierField: 'parent',
      rootParentId: null,
      showPageSizeOptions: false,
      showPagination: false,
    };
    return (
      <div>
        <HeaderBreadcrumb />
        <div>
          <DrillDownTable {...tableProps} />
        </div>
      </div>
    );
  }
}

export default HistoricalFocusInvestigation;
