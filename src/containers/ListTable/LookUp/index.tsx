// import lodash from 'lodash';
import React from 'react';
import { ColumnObj } from '..';

/** interface for LookUpProps */
export interface LookUpProps {
  columnDef: ColumnObj;
  rowValue: { [key: string]: string };
  lookupTable: any;
}

class LookUp extends React.Component<LookUpProps> {
  public render() {
    const { columnDef, rowValue, lookupTable } = this.props;
    if ('lookup_definition' in columnDef && columnDef.lookup_definition != undefined && Object.keys(lookupTable).length > 0) {
      let result = '';
      const rows = lookupTable[columnDef.lookup_definition.return_column];
      for(let i=0; i<rows.length; i++) {
        if(rowValue.id === rows[i].id) {
          result = rows[i][columnDef.lookup_definition.return_column];
          break;
        }
      }
      return <span> {result} </span>;
    }
    return null;
  }
}

export default LookUp;
