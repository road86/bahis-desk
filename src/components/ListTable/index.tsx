import * as React from 'react';
import { Table } from 'reactstrap';

interface ColumnObj {
  sortable: true | false;
  label: { [key: string]: string };
  field_name: string;
  format: string;
  data_type: string;
}

export interface ListTableProps {
  columnDefinition: ColumnObj[];
}

class ListTable extends React.Component<ListTableProps> {
  public render() {
    const { columnDefinition } = this.props;
    const appLanguage = 'English';
    return (
      <Table>
        <thead>
          <tr>
            {columnDefinition.map((singleCol: ColumnObj, index: number) => (
              <th key={'col-label-' + index}> {singleCol.label[appLanguage]} </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">1</th>
            <td>Mark</td>
          </tr>
          <tr>
            <th scope="row">2</th>
            <td>Jacob</td>
          </tr>
          <tr>
            <th scope="row">3</th>
            <td>Larry</td>
          </tr>
        </tbody>
      </Table>
    );
  }
}

export default ListTable;
