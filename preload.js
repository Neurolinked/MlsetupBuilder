const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'thePIT',
  {
			Versione: () =>{
				ipcRenderer.send('main:getversion', {})
				/*
        ipcRenderer.send('main:getargs', {})
				*/
			},
      ApriStream: (path,streamcode) =>{
        var filecontent = ipcRenderer.sendSync('main:readFile', path, streamcode);
        return filecontent
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
//autosetup version from the package
ipcRenderer.on('preload:setversion', (event, nuversion) => {
    document.title = document.title + " - " + nuversion
})

//test function
ipcRenderer.on('preload:setargs', (event, jsoncontent) => {
  var textareaDummy = document.querySelector("#passaggio")
  //pass from JSON Object to text
  textareaDummy.value = JSON.stringify(jsoncontent)
  //fire the load events
  document.querySelector("#TheMagicIsHere").click();
})

ipcRenderer.on('preload:logEntry',(event, resultSave) => {
	var notificationCenter = document.querySelector("#NotificationCenter .offcanvas-body")
	notificationCenter.innerHTML = resultSave + "\r\n" + notificationCenter.innerHTML;
})

ipcRenderer.on('preload:openlicense',(event, resultSave) => {
	var linklicenze = document.querySelector("#versionDisplay a")
	linklicenze.click()
})



window.addEventListener('DOMContentLoaded', () => {

})
