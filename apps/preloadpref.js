const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'thePIT',
  {
			Versione: () =>{
				ipcRenderer.send('main:getversion', {})
        ipcRenderer.send('main:getargs', {})
			},
      ConfiguraUnbundle:(path) => {
        ipcRenderer.send('main:setupUnbundle',path);
      },
			ConfiguraWkitCli:(path) => {
        ipcRenderer.send('main:setupCR2Wr',path);
      },
			RConfig: async (conf) => {
        return await ipcRenderer.invoke('main:getStoreValue', conf);
    	},
			SaveAll: async (conf) =>{
				ipcRenderer.send('main:saveStore',conf);
			}
	},

)

ipcRenderer.on('preload:upd_config', (event, preferences) => {
	document.getElementById(preferences.id).value = preferences.value
})
