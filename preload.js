const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'thePIT',
  {
			Versione: () =>{
				ipcRenderer.send('main:getversion', {})
				ipcRenderer.send('main:handle_args', {}) //load arguments and source json files
			},
      ApriStream: (path,streamcode,no_repo = false) =>{
        var filecontent = ipcRenderer.sendSync('main:readFile', path, streamcode, no_repo);
        return filecontent
      },
			ThreeDAsset: () =>{
				var file = ipcRenderer.send('main:3dialog');
        return file
			},
			Export:(data) => {
				ipcRenderer.send('main:writefile',data);
			},
			RConfig: async (conf) => {
        return await ipcRenderer.invoke('main:getStoreValue', conf);
    	},
			UnCookMe: async (conf)=>{
				ipcRenderer.send('main:uncookForRepo',conf);
			},
			microMe: async ()=>{
        //return await ipcRenderer.invoke('main:uncookMicroblends');
				ipcRenderer.send('main:uncookMicroblends');
			},
			getModels: ()=>{
				var additionalModels = ipcRenderer.sendSync('main:giveModels');
				return additionalModels
			},
      getMuBlends: async ()=>{
        return await ipcRenderer.invoke('main:loadMuBlend');
      },
			savePref: (conf)=>{
				ipcRenderer.send('main:saveStore',conf);
			},
      Scan: ()=>{
        ipcRenderer.send('main:scanFolder');
      },
      Foldering : (path) =>{
        //It will display the path folder chosen
        ipcRenderer.send('main:openFolder',path);
      },
      ExtOpen :(content)=>{
        //It will display external resources as videos an link in the default browser
        ipcRenderer.send('main:WindopenExt',content);
      },
      importMBlend : (package)=>{
        ipcRenderer.send('main:mBlender', package);
      },
      delMBlend : (toBeDeleted)=>{
        ipcRenderer.send('main:delmBlend',toBeDeleted);
      },
      openAim : (setups)=>{
        ipcRenderer.send('main:aimMicros',setups);
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
/*
Firable events
*/
const updblends = new Event('updMBlends');

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
				document.querySelector("#exportVersion").classList.add("d-none");
        document.querySelector("#checkCompile").classList.add("d-none");
			}else{
				console.log('no suitable version of wkit to integrate');
			}
		}
	}else{
		//nothing to do
	}
})

ipcRenderer.on('preload:logEntry',(event, resultSave, warning = false) => {
	let Data = new Date(Date.now());
	var notificationCenter = document.querySelector("#NotificationCenter .offcanvas-body")
  var fastMessage = document.getElementById("foot-message")

	notificationCenter.innerHTML = '[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + resultSave + "<br/>" + notificationCenter.innerHTML;

  fastMessage.innerHTML = resultSave.split('<br/>')[0];
	if (warning){
		let notiCounter = document.querySelector("#notyCounter span")
		if (notiCounter.innerText==''){
			notiCounter.innerText = 0
		}
		let noterrorz = parseInt(notiCounter.innerText)
		noterrorz++
		notiCounter.innerText = noterrorz
	}
})

ipcRenderer.on('preload:uncookBar',(event,text,selector)=>{
	let pbar = document.querySelector("#uncook_"+selector)
	text = text.replaceAll(/[\r|\n]+/g,"").replace("<br>","")
	pbar.setAttribute("style","width: "+text+"%;")
	pbar.setAttribute("aria-valuenow",parseInt(text))
	if (text=='100'){
			pbar.classList.remove('bg-warning','bg-normal','progress-bar-striped','progress-bar-animated')
			pbar.classList.add('bg-info')
	}
	pbar.innerText=text+'%'
})

ipcRenderer.on('preload:openModal',(event, modal2bOpen) => {
	var connection
	switch(modal2bOpen){
		case 'license':
			connection = document.querySelector("#versionDisplay a:nth-child(1)")
			break;
		case 'help':
			connection = document.querySelector("#versionDisplay a:nth-child(2)")
			break;
		case 'uncook' :
			connection = document.querySelector("#versionDisplay a:nth-child(3)")
			break;
		case 'hairs' :
			connection = document.querySelector("#versionDisplay a:nth-child(4)")
			break;
		case 'micro' :
			connection = document.querySelector("#versionDisplay a:nth-child(5)")
			break;
    case 'micromanager' :
      connection = document.querySelector("#versionDisplay a:nth-child(6)")
      break;
    case 'log' :
      connection = document.querySelector("#versionDisplay a:nth-child(7)")
      break;
	}
  try{
    connection.click()
  }catch(error){
    console.error(error);
  }
})

ipcRenderer.on('preload:scanReply',(event,result)=>{
  if (isValidJSON(result)){
    let passDatas = document.querySelector("#txtFolderScanner");
    passDatas.value = result;
    passDatas.dispatchEvent(new Event("change"));
  }
})

ipcRenderer.on('preload:enable',(event,target) => {
		let obj = document.querySelector(target)
		obj.disabled = false
		if (target=='#triggerUncook'){
			let loadCog = document.querySelector('#uncookCog')
			loadCog.classList.add('d-none')
		}else if(target=='#MycroMe'){
			let mycroCog = document.querySelector('#mycroCog')
			mycroCog.classList.add('d-none')
		}
})

ipcRenderer.on('preload:disable',(event,target) => {
	let obj = document.querySelector(target)
	obj.disabled = true
})

ipcRenderer.on('preload:stepok',(event,target) => {
	let obj = document.querySelector(target)
	obj.checked = false
	obj.dispatchEvent(new Event("change"));
})

ipcRenderer.on('preload:set_3d_asset_name',(event,result) => {
	var fileLoaded = document.querySelector("#lastCustomMDL")
	fileLoaded.value=result
	fileLoaded.dispatchEvent(new Event('change', { 'bubbles': true }));
})

ipcRenderer.on('preload:noBar',(event,result)=>{
	var progBar = document.querySelector('#pBar')
	progBar.classList.remove("progress-bar","progress-bar-striped","bg-danger","progress-bar-animated")
})

ipcRenderer.on('preload:uncookErr',(event,msg,logger='#uncookLogger')=>{
	var logtext = document.querySelector(logger+' div')
	logtext.innerHTML = msg + logtext.innerHTML
})
ipcRenderer.on('preload:uncookLogClean',(event,logger='#uncookLogger')=>{
	var logtext = document.querySelector(logger+' div')
	logtext.innerHTML = ''
})

ipcRenderer.on('preload:packageDone',(event,result)=>{
  var mbloading = document.querySelector('#CheckSaveMblend div')
  var mblogload = document.querySelector('#mbLogPackager')
  if (result) {
    var package = document.getElementById('mbListPackage')
    var files = document.getElementById('mblendUserManager')
    package.value = ''
    files.innerHTML = ''
    mblogload.innerHTML='Custom microblends uploaded'
  }else{
    mblogload.innerHTML='Error during the operations'
  }
  mblogload.classList.add("show")
  mbloading.remove()
  document.dispatchEvent(updblends);
})

ipcRenderer.on('preload:MuReload',(event,result)=>{
  document.dispatchEvent(updblends);
})

ipcRenderer.on('preload:setMicroCoords',(event,data)=>{
  if (data.Link){
    document.getElementById('layerTile').value = data.S //size
    document.getElementById('layerOffU').value = data.H //Horizontal
    document.getElementById('layerOffV').value = data.V //Vertical
  }
  document.getElementById('mbTile').value = data.S //size
  document.getElementById('mbOffU').value = data.H //Horizontal
  document.getElementById('mbOffV').value = data.V //Vertical
})
