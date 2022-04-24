// main.js
// Modules to control application life and create native browser window
const { app, BrowserWindow, Notification, ipcMain, nativeTheme, dialog, Menu } = require('electron')
var child = require('child_process').execFile;
var spawner = require('child_process').spawn;
const path = require('path')
const fs = require('fs')
const store = require('electron-store');
const sharp = require('sharp');


var objwkitto ={}
const schema = {
	unbundle: {
		type: 'string',
		default: ''
	},
	wcli: {
		type: 'string',
		default: ''
	},
	maskformat:{
		type: 'string',
		default: 'dds'
	}
};

const preferences = new store({schema});
preferences.watch = true
let mainWindow

var mljson = app.commandLine.getSwitchValue("open")
if (mljson ==''){
  mljson = app.commandLine.getSwitchValue("o")
}


var wkitto = app.commandLine.getSwitchValue("wkit")

const createModal = (htmlFile, parentWindow, width, height, title='MlsetupBuilder', preferences) => {
  let modal = new BrowserWindow({
    width: width,
    height: height,
    modal: true,
    parent: parentWindow,
		webPreferences: preferences,
		title: title
  })
	modal.menuBarVisible=false
	modal.minimizable=false
  modal.loadFile(htmlFile)
	modal.once('ready-to-show', () => {
		modal.show()
	})
  return modal;
}

const isMac = process.platform === 'darwin'
var wcliExecutable = new RegExp(/.+WolvenKit\.CLI\.exe$/)
var normals = new RegExp(/.+n\d{2}\.(xbm|png|dds)$/)
var buildMenu = wcliExecutable.test(preferences.get('wcli'),'i');

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [{ role: 'about' },{ type: 'separator' },{ role: 'services' },{ type: 'separator' },{ role: 'hide' },{ role: 'hideOthers' },{ role: 'unhide' },{ type: 'separator' },{ role: 'quit' }]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
			{label: '&Preferences', click: () =>{
				createModal("apps/prefs.html",mainWindow,800,300,'Preferences', {preload: path.join(__dirname, 'apps/preloadpref.js')} );
			}},
			{ type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
				{ role: 'pasteAndMatchStyle' },{ role: 'delete' },{ role: 'selectAll' },{ type: 'separator' },{label: 'Speech',submenu: [{ role: 'startSpeaking' },{ role: 'stopSpeaking' }]}
      ] : [
        { role: 'delete' },{ type: 'separator' },{ role: 'selectAll' }
      ])
    ]
  },
	...(buildMenu ? [
		{id:99, label: 'Build', submenu:[ {
			label:'Repository',
			click: () =>{
				mainWindow.webContents.send('preload:openModal','uncook')
			}
		}, {
			label:'Microblends',
			click: () =>{
				mainWindow.webContents.send('preload:openModal','micro')
			}
		}] }
	] : [
		{id:99, label: 'Build', submenu:[{label:'Setup first Wolvenkit CLI', enabled:false}] }
	]),
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [{ role: 'reload' },{ role: 'forceReload' },{ role: 'toggleDevTools' },{ type: 'separator' },{ role: 'resetZoom' },{ role: 'zoomIn' },{ role: 'zoomOut' },{ type: 'separator' },{ role: 'togglefullscreen' }]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [{ label: 'Hairs tool',accelerator: 'Ctrl+H',click:()=>{ mainWindow.webContents.send('preload:openModal','hairs')}},{ role: 'minimize' },{ role: 'zoom' },
      ...(isMac ? [{ type: 'separator' },{ role: 'front' },{ type: 'separator' },{ role: 'window' } ] : [ { role: 'close' } ])
    ]
  },
  {
    role: 'help',
    submenu: [
			{label:'Documentation',
			accelerator: 'F1',
			click:()=>{
				mainWindow.webContents.send('preload:openModal','help')
			}},
			{label:'License',click: () =>{
				mainWindow.webContents.send('preload:openModal','license')
		}}]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createWindow () {
  // Create the browser window.
   mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webgl:true,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  nativeTheme.themeSource = 'dark';
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

const prefupdate = preferences.onDidAnyChange(()=>{
	mainWindow.webContents.send('preload:upd_config',preferences.store)
})
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
//read file on disk
ipcMain.on('main:readFile',(event,percorso,flags)=>{
  fs.readFile(path.join(preferences.get('unbundle'),percorso),flags,(err,contenutofile) =>{
    if (err) {
      if (err.code=='ENOENT'){
				if (normals.test(percorso)){
					event.reply('preload:logEntry', 'normal map not found in : '+path.join(preferences.get('unbundle'),percorso),true)
				}else{
					dialog.showErrorBox("File opening error","The searched file does not exists "+path.join(preferences.get('unbundle'),percorso))
				}
      }else{
        dialog.showErrorBox("File opening error",err.message)
      }
      contenutofile=""
    }
    event.returnValue = contenutofile
  })
})
//restored arguments reading
ipcMain.on('main:handle_args', (event, payload) => {
  if (mljson!=""){
    fs.stat(mljson,'utf8',function(err, stat) {
      if (err) {
        if (err.code=='ENOENT'){
          dialog.showErrorBox("File opening error","The searched file does not exists")
        }else{
          dialog.showErrorBox("File opening error",err.message)
        }
        return
      }else{
        var mlsetup_content = ""
        fs.readFile(mljson,'utf8',(err,data) =>{
          try {
              mlsetup_content = JSON.parse(data)
          } catch(e) {
             dialog.showErrorBox("File error","Reading error: wrong json file format")
             mlsetup_content = ""
          }
          event.reply('preload:load_source',mlsetup_content)
        })
      }
    })
  }
	//manage features for WolvenkitCLI
	if (wkitto!=''){
		if (/^\d+\.\d+\.\d+(-\w+)?\.\d{4}-\d{2}-\d{2}$/.test(wkitto)){
			 objwkitto={
				full:wkitto,
				major:Number(wkitto.split('.')[0]),
				minor:Number(wkitto.split('.')[1]),
				patches:Number(wkitto.split('.')[2].split('-')[0])
			}
			event.reply('preload:logEntry', 'MlsetupBuilder is working as Wolvenkit plugin')
			event.reply('preload:wkitBuild',JSON.stringify(objwkitto))
		}else if (/^\d+\.\d+\.\d+$/.test(wkitto)){
			 objwkitto={
				full:wkitto,
				major:Number(wkitto.split('.')[0]),
				minor:Number(wkitto.split('.')[1]),
				patches:Number(wkitto.split('.')[2])
			}
			event.reply('preload:logEntry', 'MlsetupBuilder is working as Wolvenkit plugin')
			event.reply('preload:wkitBuild',JSON.stringify(objwkitto))
		}else if (/^\d+\.\d+-rc\d+$/.test(wkitto)){
			 objwkitto={
				full:wkitto,
				major:Number(wkitto.split('.')[0]),
				minor:Number(wkitto.split('.')[1].split('-')[0]),
				patches:0
			}
			event.reply('preload:logEntry', 'MlsetupBuilder is working as Wolvenkit plugin')
			event.reply('preload:wkitBuild',JSON.stringify(objwkitto))
		}
	}
})

//Window for reading 3d models
ipcMain.on('main:read3dFile',(event,percorso,flags)=>{
  fs.readFile(percorso,flags,(err,contenutofile) =>{
    if (err) {
      if (err.code=='ENOENT'){
        dialog.showErrorBox("File opening error","The searched file does not exists "+path.join(preferences.get('unbundle'),percorso))
      }else{
        dialog.showErrorBox("File opening error",err.message)
      }
      contenutofile=""
    }
    event.returnValue = contenutofile
  })
})
//setup the version of the software where needed
ipcMain.on('main:getversion',(event, arg) =>{
	event.reply('preload:setversion',app.getVersion())
})
//write the configuration file after the selection of the directory in the
//preference interface window
ipcMain.on('main:setupUnbundle',(event, arg) => {
  const result = dialog.showOpenDialog({title:'Choose the unbundle folder', properties: ['openDirectory'],defaultPath:arg }).then(result => {
    if (!result.canceled){
			if (result!=undefined){
				event.reply('preload:upd_config',{'value':result.filePaths[0],'id':'prefxunbundle'})
			}else{
				console.log('errore')
			}
    }
  }).catch(err => {
    dialog.showErrorBox("Preferences error",err.message)
  })
})
//dialog for getting the WolvenkitCLI.exe command
ipcMain.on('main:setupCR2Wr',(event, arg) => {
  const result = dialog.showOpenDialog({
		title:'Choose the Wolvenkit-CLI executable',
		filters:[ { name: 'executables', extensions: ['exe'] }],
		defaultPath:arg
	}).then(result => {
    if (!result.canceled){
			event.reply('preload:upd_config',{'value':result.filePaths[0],'id':'wCLIexe'})
    }
  }).catch(err => {
    dialog.showErrorBox("Preferences setup error",err.message)
  })
})

ipcMain.on('main:3dialog',(event, arg) => {
	const result = dialog.showOpenDialog({
		title:'Load a 3d asset',
		filters:[ /*{ name: 'Autodesk FBX', extensions: ['fbx'] },*/{ name: 'GL Transmission Format', extensions: ['glb','gltf'] }],
		properties :['openFile']
	}).then(threeDAsset => {
    if (!threeDAsset.canceled){
			event.reply('preload:logEntry', 'File choosen : '+threeDAsset.filePaths[0]+'<br/>')
			event.reply('preload:set_3d_asset_name',threeDAsset.filePaths[0]);
    }
  }).catch(err => {
    dialog.showErrorBox("Error reading the file :",err.message)
  })
})
//Save the preferences
ipcMain.on('main:saveStore',(event, arg) => {
	if (arg.hasOwnProperty('unbundle')){
		preferences.set('unbundle',arg.unbundle);
	}
	if (arg.hasOwnProperty('wcli')){
		preferences.set('wcli',arg.wcli);
	}
	if (arg.hasOwnProperty('maskformat')){
		preferences.set('maskformat',arg.maskformat);
	}
})

//json version of mlsetup file write operation
ipcMain.on('main:writefile',(event,arg) => {
	var def_path
	if (mljson!=''){
		def_path = path.normalize(mljson)
	}else{
		def_path = arg.file
	}
	if (arg.type=='mlsetup'){
		const salvataggio = dialog.showSaveDialog({
			title:'Save the mlsetup jsonized',
			defaultPath: def_path,
			filters:[ { name: 'All Files', extensions: ['*'] },	{ name: 'Jsons', extensions: ['json'] } ],
			properties: ['createDirectory']
		}).then(salvataggio => {
		    if (!salvataggio.canceled){
					fs.writeFile(salvataggio.filePath, arg.content,'utf8',(errw,data) =>{
						if(errw){
							event.reply('preload:noBar','')
							dialog.showErrorBox('Error during the writing process of the file')
							return
						}else{
							if (!objwkitto.hasOwnProperty('major')){
								let test = preferences.get('wcli')
								if (test.match(/.+WolvenKit\.CLI\.exe$/)){
									child( test, ["cr2w", "-p",salvataggio.filePath, "-d"],(err, data)=>{
										if (err){
											event.reply('preload:logEntry', 'Error: '+err+'\n')
											new Notification({title:'Conversion Error',body: err }).show()
											event.reply('preload:noBar','')
										}else{
											 event.reply('preload:logEntry', 'Operation executed '+data.toString().split(/\r\n/).reverse().join('<br/>')+'\n')
											 new Notification({title:"Conversion executed", body: "Your file has been saved and converted to CR2W format" }).show()
											 event.reply('preload:noBar','')
										}
									})
								}
							}else{
								 new Notification({title:"Conversion executed", body: "Your file has been saved, remember to convert it back in Wolvenkit. Shutting Down" }).show()
								 event.reply('preload:noBar','')
								 app.exit(0)
							}
						}
					})
					event.reply('preload:logEntry', 'File saved in: '+salvataggio.filePath+'\n')
				}else{
					event.reply('preload:noBar','')
					event.reply('preload:logEntry', 'Save procedure cancelled')
				}
		})
	}
	mljson = ''
});

//Get request for stored preferences values
ipcMain.handle('main:getStoreValue', (event, key) => {
	if (key===undefined){
		return preferences.store;
	}else{
		return preferences.get(key);
	}
});

function uncookRun(toggle,params,stepbar){
	return new Promise((resolve,reject) =>{
		var subproc
		if (toggle){
			let uncooker = preferences.get('wcli')
			subproc = spawner(uncooker,params).on('error',function(err){
				mainWindow.webContents.send('preload:uncookErr',err)
			})

			let oldtxt = ''
			subproc.stdout.on('data', (data) => {

				if (!(/%/.test(data.toString()))){
					mainWindow.webContents.send('preload:uncookErr',`${data}`)
				}else{
						if (oldtxt != data.toString().split("%")[0]){
							oldtxt = data.toString().split("%")[0]

							if (oldtxt.length>4){
								mainWindow.webContents.send('preload:uncookErr',`${data}`)
							}else{
								mainWindow.webContents.send('preload:uncookBar',oldtxt,stepbar)
							}
						}
				}

			});

			subproc.stderr.on('data', (data) => {
				mainWindow.webContents.send('preload:logEntry',`stderr: ${data}`,true)
				mainWindow.webContents.send('preload:uncookErr',`${data}`)
			});

			subproc.on('close', (code) => {
				if (code == 0){
					switch (stepbar) {
						case 'step1':
						case 'step3':
						case 'step5':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Mesh and mlmasks Done</span>')
							break;
						case 'step2':
						case 'step4':
						case 'step6':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Normal map Done</span>')
							break;
						case 'micro_opt01':
						case 'micro_opt02':
						case 'micro_opt03':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Microblends extracted</span>','#microLogger')
							break;
					}
					mainWindow.webContents.send('preload:uncookBar','100',stepbar)
					resolve()
				}else{
					mainWindow.webContents.send('preload:uncookErr',`child process exited with code ${code}`,true)
					reject()
				}
			})

		}else{
			resolve()
		}
	})
}

ipcMain.on('main:uncookForRepo',(event,conf)=> {
	fs.access(path.normalize(preferences.get('unbundle')),fs.constants.W_OK,(err)=>{
		if (err){
			// The folder isn't accessible for writing
			dialog.showErrorBox("It seems that you can't write in your unbundle folder. Try to check your permissions for that folder ",err.message)
		}else{
			var archives = dialog.showOpenDialog({title:'Select the game folder with the default archives (found in Cyberpunk 2077\\archive\\pc\\content)',properties: ['openDirectory'],defaultPath:app.getPath('desktop')})
			.then(selection => {
				if (!selection.canceled){
					let unbundlefoWkit = String(preferences.get('unbundle')).replace(/base$/,'')
					let uncooker = preferences.get('wcli')
					if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
						if (typeof(conf)=='object'){
							mainWindow.webContents.send('preload:uncookLogClean')

							uncookRun(conf[0],["uncook", "-p", path.join(selection.filePaths[0],'basegame_3_nightcity.archive'), "-r","^base.(vehicles|weapons|characters|mechanical).+(?!proxy).+\.(mesh|mlmask)$","-or",unbundlefoWkit,"-o",unbundlefoWkit],'step1')
								.then(()=> uncookRun(conf[0],["uncook", "-p", path.join(selection.filePaths[0],'basegame_3_nightcity.archive'), "-r","^base.+n[0-9]{2}\.xbm$","--uext","png","-o",unbundlefoWkit],'step2'))
								.then(()=>{mainWindow.webContents.send('preload:stepok',"#arc_NC3")})
								.then(()=>uncookRun(conf[1],["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_appearance.archive'), "-r","^base.(vehicles|weapons|characters|mechanical).+(?!proxy).+\.(mesh|mlmask)$","-or",unbundlefoWkit,"-o",unbundlefoWkit],'step3'))
								.then(()=>uncookRun(conf[1],["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_appearance.archive'), "-r","^base.+n[0-9]{2}\.xbm$","--uext","png","-o",unbundlefoWkit],'step4'))
								.then(()=>{mainWindow.webContents.send('preload:stepok',"#arc_AP4")})
								.then(()=>uncookRun(conf[2],["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_gamedata.archive'), "-r","^base.(vehicles|weapons|characters|mechanical).+(?!proxy).+\.(mesh|mlmask)$","-or",unbundlefoWkit,"-o",unbundlefoWkit],'step5'))
								.then(()=>uncookRun(conf[2],["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_gamedata.archive'), "-r","^base.+n[0-9]{2}\.xbm$","--uext","png","-o",unbundlefoWkit],'step6'))
								.then(()=>{mainWindow.webContents.send('preload:stepok',"#arc_GA4")})
								.catch(err => { console.log(err) })
								.finally(() => { 	mainWindow.webContents.send('preload:enable',"#triggerUncook") })
							}
					}
				}
			})
		}
	})
})

ipcMain.on('main:uncookMicroblends',(event)=>{
	fs.access(path.normalize(preferences.get('unbundle')),fs.constants.W_OK,(err)=>{
		if (err){
			// The folder isn't accessible for writing
			dialog.showErrorBox("It seems that you can't write in your unbundle folder. Try to check your permissions for that folder ",err.message)
		}else{
			var archives = dialog.showOpenDialog({title:'Select the game folder with the default archives (found in Cyberpunk 2077\\archive\\pc\\content)',properties: ['openDirectory'],defaultPath:app.getPath('desktop')})
			.then(selection => {
				if (!selection.canceled){
					let unbundlefoWkit = String(preferences.get('unbundle')).replace(/base$/,'')
					let uncooker = preferences.get('wcli')
					var countingOnYou = 0

					if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
						mainWindow.webContents.send('preload:uncookLogClean','#microLogger')

						uncookRun(true,["uncook", "-p", path.join(selection.filePaths[0],'basegame_1_engine.archive'), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt01')
							.then(()=> 	uncookRun(true,["uncook", "-p", path.join(selection.filePaths[0],'basegame_3_nightcity.archive'), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt02'))
							.then(()=> 	uncookRun(true,["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_gamedata.archive'), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt03'))
							.then(()=> {
								return new Promise((resolve,reject) =>{
									fs.readdir(path.join(String(preferences.get('unbundle')),'surfaces/microblends/'),(err,files)=>{
										if (err){
												mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger')
												reject()
									  }else {
											var slavefiles = []
											files.forEach((el)=>{
												if (el.match(/.+\.png$/))
												slavefiles.push(el)
											})
											mainWindow.webContents.send('preload:uncookErr','Found '+slavefiles.length+' microblends to process','#microLogger')
											resolve(slavefiles)
										}
									})
								})
							})
							.then((files)=>{
								//console.log(files)
								try{
									var perc = Number(100/files.length).toFixed(2)
									var k = 1
									files.forEach((png)=>{

										sharp(path.join(String(preferences.get('unbundle')),'surfaces/microblends/',png))
											.resize(256)
											.toFile(path.join(app.getAppPath(),'images/',png), (err, info) => {
												 if(err){
													 mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger')
												 }else{
													 mainWindow.webContents.send('preload:uncookBar',String(Math.round(Number(perc * k))),'mresize')
												 }
											  })
												.resize(64)
												.toFile(path.join(app.getAppPath(),'images/thumbs/',png), (err, info) => {
													 if(err){
														 mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger')
													 }else{
														 mainWindow.webContents.send('preload:uncookBar',String(Math.round(Number(perc * k))),'mthumbs')
													 }
												  })
										k++
									})
								}catch(err){
									mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger')
								}
							})
							.catch((err)=>{mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger')})
							.finally(() => { 	mainWindow.webContents.send('preload:enable',"#MycroMe") })
					}
				}
			})
		}
	})
})
