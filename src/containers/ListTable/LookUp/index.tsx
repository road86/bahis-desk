// import lodash from 'lodash';
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
    if ('lookup_definition' in columnDef && columnDef.lookup_definition != undefined && lookupTable) {
      // const conditions = columnDef.lookup_definition.condition;
      // const filterCondition: any = {};
      // conditions.forEach((condition) => {
      //   if (condition.type === 'static') {
      //     filterCondition[condition.name] = condition.value;
      //   } else if (condition.type === 'list') {
      //     filterCondition[condition.name] = rowValues[condition.column];
      //   }
      // });
      // const filteredTable = lodash.filter(lookupTable, filterCondition);
      const uniqData = rowValues[columnDef.field_name];
      const uniqValues = lookupTable.find((obj: any) => obj[`${columnDef.lookup_definition?.column_name}`] == uniqData);
      // return <span>{uniqValues.toString()}</span>;     
      return <span>{uniqValues[`${columnDef.lookup_definition?.return_column}`]}</span>;
    }
    return null;
  }
}

export default LookUp;
