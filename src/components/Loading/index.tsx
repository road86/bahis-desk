import * as React from 'react';
import { Redirect } from 'react-router';
import { ipcRenderer } from '../../services/ipcRenderer';

/** interface for Loading State */
interface LoadingState {
  isLoadComplete: boolean;
}

class Loading extends React.Component<{}, LoadingState> {
  constructor(props: any) {
    super(props);
    this.state = { isLoadComplete: false };
  }
  public async componentDidMount() {
    const response = await ipcRenderer.sendSync('start-app-sync');
    if (response) {
      this.setState({ isLoadComplete: true });
    }
  }

  public render() {
    return (
      <div>
        {this.state.isLoadComplete && <Redirect to="/menu/" />}
        <div>Loading ... </div>
      </div>
    );
  }
}

export default Loading;
