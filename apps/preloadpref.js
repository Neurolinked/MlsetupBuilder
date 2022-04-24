const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'thePIT',
  {
			Args: async() =>{
        ipcRenderer.send('main:handle_args', {})
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

function isValidJSON(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

ipcRenderer.on('preload:wkitBuild', (event, versionchecker) => {
	var wkitto
	if (isValidJSON(versionchecker)){
		wkitto = JSON.parse(versionchecker);
		if ((wkitto.hasOwnProperty('major')) && (wkitto.hasOwnProperty('minor'))){
			if (Number(wkitto.major+'.'+wkitto.minor)>=8.5) {
				/*
				document.querySelector("#wCLIexe").parentNode.classList.add("d-none");
				document.querySelector("#wCLIexe").readOnly = true;
				*/
			}else{
				console.log('no suitable version of wkit to integrate');
			}
		}
	}else{
		//nothing to do
	}
})

ipcRenderer.on('preload:upd_config', (event, preferences) => {
  document.getElementById(preferences.id).value = preferences.value
  const trig = new Event("blur");
  document.getElementById(preferences.id).dispatchEvent(trig)
})
