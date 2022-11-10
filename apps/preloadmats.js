const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'thePIT',
  {
    ReadConfig: async (conf) => {
      return await ipcRenderer.invoke('main:getStoreValue', conf);
    },
    BackupLibrary:(content) => {
      let data = {
        type : 'materialLibrary',
        file : 'material_template.json',
        content: content
      }
      ipcRenderer.send('main:writefile',data);
    },
    Export:(content) =>{
      let data = {
        type : 'materialBuffer',
        file : 'last.Material.json',
        content: content
      }
      ipcRenderer.send('main:writefile',data);
    }
	}
)

function isValidJSON(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
