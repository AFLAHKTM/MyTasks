const { ipcRenderer } = require('electron');

// Expose IPC to browser window context
window.electronIPC = {
  showAlarmWindow: () => ipcRenderer.send('show-alarm-window')
};
