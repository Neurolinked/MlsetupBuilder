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
    	},
			UnCookMe: async (conf)=>{
				ipcRenderer.send('main:uncookForRepo',conf);
			},
			microMe: async ()=>{
				ipcRenderer.send('main:uncookMicroblends');
			},
			getModels: ()=>{
				var additionalModels = ipcRenderer.sendSync('main:giveModels');
				return additionalModels
			},
      getMuBlends: async ()=>{
        return await ipcRenderer.invoke('main:loadMuBlend');
      },
      setMuBlends: ()=>{},
			savePref: (conf)=>{
				ipcRenderer.send('main:saveStore',conf);
			},
      Scan: ()=>{
          ipcRenderer.send('main:scanFolder');
      },
      SupportMe : ()=> {
        ipcRenderer.send('main:supportNeuro');
      },
      extMedia : (code)=> {
        ipcRenderer.send('main:openmedia', code);
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

ipcRenderer.on('preload:logEntry',(event, resultSave, warning = false) => {
	let Data = new Date(Date.now());
	var notificationCenter = document.querySelector("#NotificationCenter .offcanvas-body")
	notificationCenter.innerHTML = '[ '+Data.toLocaleString('en-GB', { timeZone: 'UTC' })+' ] ' + resultSave + "<br/>" + notificationCenter.innerHTML;
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
			connection.click()
			break;
		case 'help':
			connection = document.querySelector("#versionDisplay a:nth-child(2)")
			connection.click()
			break;
		case 'uncook' :
			connection = document.querySelector("#versionDisplay a:nth-child(3)")
			connection.click()
			break;
		case 'hairs' :
			connection = document.querySelector("#versionDisplay a:nth-child(4)")
			connection.click()
			break;
		case 'micro' :
			connection = document.querySelector("#versionDisplay a:nth-child(5)")
			connection.click()
			break;
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
	progBar.classList.remove('show')
})

ipcRenderer.on('preload:uncookErr',(event,msg,logger='#uncookLogger')=>{
	var logtext = document.querySelector(logger+' div')
	logtext.innerHTML = msg + logtext.innerHTML
})
ipcRenderer.on('preload:uncookLogClean',(event,logger='#uncookLogger')=>{
	var logtext = document.querySelector(logger+' div')
	logtext.innerHTML = ''
})

window.addEventListener('DOMContentLoaded', () => {

})
