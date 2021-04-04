import lodash from 'lodash';
import React from 'react';
import { ColumnObj } from '..';

/** interface for LookUpProps */
export interface LookUpProps {
  columnDef: ColumnObj;
  rowValues: { [key: string]: string };
  lookupTable: any;
}

class LookUp extends React.Component<LookUpProps> {
  public render() {
    const { columnDef, rowValues, lookupTable } = this.props;
    if ('lookup_definition' in columnDef && columnDef.lookup_definition) {
      const conditions = columnDef.lookup_definition.condition;
      const filterCondition: any = {};
      conditions.forEach((condition) => {
        if (condition.type === 'static') {
          filterCondition[condition.name] = condition.value;
        } else if (condition.type === 'list') {
          filterCondition[condition.name] = rowValues[condition.column];
        }
      });
      const filteredTable = lodash.filter(lookupTable, filterCondition);
      const uniqRows = lodash.uniqBy(filteredTable, columnDef.lookup_definition.return_column);
      const uniqValues = lodash.map(
        uniqRows,
        (row: any) => row[(columnDef as any).lookup_definition.return_column] || '',
      );
      return <span>{uniqValues.toString()}</span>;
    }
    return null;
  }
}

export default LookUp;
