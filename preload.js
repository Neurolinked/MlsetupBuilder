const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'thePIT',
  {
			Versione: () =>{
				ipcRenderer.send('main:getversion', {})
				ipcRenderer.send('main:handle_args', {}) //load arguments and source json files
			},
      ApriStream: (path,streamcode) =>{
        var filecontent = ipcRenderer.sendSync('main:readFile', path, streamcode);
        return filecontent
      },
			EDStream: (path,streamcode) =>{
        var filecontent = ipcRenderer.sendSync('main:read3dFile', path, streamcode);
        return filecontent
      },
			ThreeDAsset: () =>{
				var file = ipcRenderer.send('main:3dialog');
        return file
			},
      ConfiguraUnbundle:() => {
        ipcRenderer.send('main:setupUnbundle',{});
      },
			ConfiguraWkitCli:() => {
        ipcRenderer.send('main:setupCR2Wr',{});
      },
			Export:(data) => {
				ipcRenderer.send('main:writefile',data);
			},
			RConfig: async (conf) => {
        return await ipcRenderer.invoke('main:getStoreValue', conf);
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
//autosetup version from the package
ipcRenderer.on('preload:setversion', (event, nuversion) => {
    document.title = document.title + " - " + nuversion
})

//Load The files in the arguments
ipcRenderer.on('preload:load_source', (event, jsoncontent) => {
  var textareaDummy = document.querySelector("#passaggio")
  //pass from JSON Object to text
  textareaDummy.value = JSON.stringify(jsoncontent)
  //fire the load events
  document.querySelector("#TheMagicIsHere").click();
})

ipcRenderer.on('preload:wkitBuild', (event, versionchecker) => {
	sessionStorage.setItem("wkitBuild",versionchecker);
  var wkitto
	if (isValidJSON(versionchecker)){
		wkitto = JSON.parse(versionchecker);
		if ((wkitto.hasOwnProperty('major')) && (wkitto.hasOwnProperty('minor'))){
			if (Number(wkitto.major+'.'+wkitto.minor)>=8.5) {
				document.querySelector("#exportJason").classList.add("d-none");
			}else{
				console.log('no suitable version of wkit to integrate');
			}
		}
	}else{
		//nothing to do
	}
})

ipcRenderer.on('preload:logEntry',(event, resultSave) => {
	var notificationCenter = document.querySelector("#NotificationCenter .offcanvas-body")
	notificationCenter.innerHTML = resultSave + "<br/>" + notificationCenter.innerHTML;
})

ipcRenderer.on('preload:openlicense',(event, resultSave) => {
	var linklicenze = document.querySelector("#versionDisplay a")
	linklicenze.click()
})

ipcRenderer.on('preload:set_3d_asset_name',(event,result) => {
	var fileLoaded = document.querySelector("#lastCustomMDL")
	fileLoaded.value=result
	fileLoaded.dispatchEvent(new Event('change', { 'bubbles': true }));
})


window.addEventListener('DOMContentLoaded', () => {

})
