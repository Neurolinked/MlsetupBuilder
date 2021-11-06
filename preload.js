const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'thePIT',
  {
			Versione: () =>{
				ipcRenderer.send('main:getversion', {})
        ipcRenderer.send('main:getargs', {})
			},
      Preferenze: () =>{
        ipcRenderer.send('main:readPrefs',{});
      },
      ApriStream: (path,streamcode) =>{
        var filecontent = ipcRenderer.sendSync('main:readFile', path, streamcode);
        return filecontent
      },
      ConfiguraUnbundle:() => {
        ipcRenderer.send('main:setupUnbundle',{});
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

//loading preference
ipcRenderer.on('preload:prefsOn', (event, theresult) => {
    var notificationCenter = document.querySelector("#NotificationCenter .offcanvas-body")
    //static check or uncheck on the page for future use
    var configurazione

    try {
      configurazione = JSON.parse(theresult)
    } catch (err) {
      // SyntaxError
      console.log(err)
      return
    }
    //notificationCenter.innerHTML = typeof(configurazione)+theresult

    var preferenzecaricate = document.querySelector("#prefloaded")
    //inviare evento nella pagina centrale per eliminare i contenuti non presenti
    if  (typeof(configurazione) === 'object') {
      notificationCenter.innerHTML = "Preference file loaded\n"+notificationCenter.innerHTML;
      //caricamento informazioni nella pagina.
      var unbundlepath = document.querySelector("#prefxunbundle")
      unbundlepath.value = configurazione.unbundle
      preferenzecaricate.checked = true
    }else{
      notificationCenter.innerHTML = "No path setup for the source folder" + notificationCenter.innerHTML+"\n";
      preferenzecaricate.checked = false
    }
})

ipcRenderer.on('preload:prefsLoad', (event, unbundlepath) => {
  let path_unbundle = document.querySelector("#prefxunbundle")
  path_unbundle.value = unbundlepath
})

window.addEventListener('DOMContentLoaded', () => {

})
