declare global {
  interface Window {
    require: any;
  }
}

const electron = window.require('electron');
export const ipcRenderer = electron.ipcRenderer;