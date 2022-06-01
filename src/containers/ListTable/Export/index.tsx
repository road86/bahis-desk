import React from 'react';

import { Button } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { exportToExcel } from '../../../helpers/utils';

interface ExportProps {
  generateExcel: any
}

interface ExportState {
  dataset: any;
  query: string;
}

class Export extends React.Component<ExportProps, ExportState> {
  public state = { dataset: null, query: '' };

  public render() {
    return (
      <Button style={{ backgroundColor: '#8ac390', borderColor: '#8ac390', margin: 10 }} onClick={async () => exportToExcel(await this.props.generateExcel())}>
        <FontAwesomeIcon icon={['fas', 'long-arrow-alt-down']} /> Export to XLSX
      </Button>
    );
  }

}

export default Export;
