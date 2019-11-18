declare global {
  interface Window {
    require: any;
  }
}
export const ipcRenderer = window.require('electron').ipcRenderer;
