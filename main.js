// main.js
// Modules to control application life and create native browser window
const { app, BrowserWindow, Notification, ipcMain, nativeTheme, dialog, Menu } = require('electron')
var child = require('child_process').execFile;
var spawner = require('child_process').spawn;
const path = require('path')
const fs = require('fs')
const store = require('electron-store');
const sharp = require('sharp');
const dree = require('dree');
const outside = require('electron').shell;

const dreeOptions = {
	stat:false,
	followLinks:false,
	hash:true,
	sizeInBytes: false,
	size: false,
	extensions: ["glb","png","dds","mlmask"],
	normalize:true,
	excludeEmptyDirectories:true
}

const _microblends = 0
const _decals = 1
const _jsons = 2

var customModels
var userResourcesPath = '/_Migrate/'
var userRScheme = [
		'mblend',
		'decals',
		'jsons'
		]

var objwkitto = {}
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
	},
	legacymaterial:{
		type:'boolean',
		default: false
	},
	usermigration:{
		type:'boolean',
		default: false
	}
};

const preferences = new store({schema,
	migrations: {
		'<=1.6.2': store => {
			if (store.has('unbundle') && (!store.has('pathfix'))){
				let fixstring = store.get('unbundle')
				store.set('unbundle',fixstring.replace(/\\base$/,''))
				store.set('pathfix','1')
			}
		},
		'1.6.3': store => {
			store.delete('pathfix')
			store.set('legacymaterial',false)
		}
	}
});

preferences.watch = true
let mainWindow

var mljson = app.commandLine.getSwitchValue("open")
if (mljson ==''){
  mljson = app.commandLine.getSwitchValue("o")
}

var wkitto = app.commandLine.getSwitchValue("wkit")
var dev = app.commandLine.getSwitchValue("dev")

function MuReading(){
	return new Promise((resolve,reject) =>{
		let app_custom_json = path.join(app.getAppPath(),userRScheme[_jsons],'/mbcustom.json')/* application file  */

		fs.readFile(app_custom_json,(err,contenutofile) =>{
			if (err) {
				reject()
			}else{
				try{
					let test = JSON.parse(contenutofile)
					resolve(test)
				}catch(err){
					reject()
				}
			}
		})
	})
}

function MuWriting(contenuto){
	return new Promise((resolve,reject) =>{
		let app_custom_json = path.join(app.getAppPath(),userRScheme[_jsons],'/mbcustom.json')/* application file  */
		let bk_custom_json = path.join(app.getPath('userData'),userResourcesPath,userRScheme[_jsons],'/mbcustom.json')/* application file  */

		fs.writeFile(app_custom_json,contenuto,(err) =>{
			if (err) {
				reject()
			}else{
				fs.copyFile(app_custom_json,bk_custom_json,fs.constants.COPYFILE_FICLONE,(err) =>{
					if (err) {
						mainWindow.webContents.send('preload:logEntry', "it's impossible to create the copy backup",true)
					}
					resolve(true)
				})
			}
		})
	})
}

function customResource(){
	let pathMigration = path.join(app.getPath('userData'),userResourcesPath)

	try {
    if (!fs.existsSync(pathMigration)){
			fs.mkdir(pathMigration, { recursive: true }, (err) => {
				if (err) dialog.showErrorBox("The migration folder isn't accessible, trying to create one : -",err.message)
			})
		}
		userRScheme.forEach((item, i) => {
			let dirToMake = path.join(pathMigration,item)
			if (!fs.existsSync(dirToMake)){
				fs.mkdir(dirToMake, { recursive: true }, (err) => {
					if (err) dialog.showErrorBox(`The ${dirToMake} folder isn't accessible, trying to create one : - ${err.message}`)
				})
			}
		});
    // The check succeeded
	} catch (error) {
	    // The check failed
			dialog.showErrorBox("The migration folder isn't accessible, trying to create one",error)
	}
}

customResource()

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

const childWindow = (htmlFile, parentWindow, width, height, title='MlsetupBuilder', preferences) => {
  let mywin = new BrowserWindow({
    width: width,
    height: height,
    modal: false,
    parent: parentWindow,
		webPreferences: preferences,
		title: title
  })
	mywin.menuBarVisible=false
	mywin.minimizable=true
  mywin.loadFile(htmlFile)
	mywin.once('ready-to-show', () => {
		mywin.show()
	})
  return mywin;
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
        { role: 'delete' },{ type: 'separator' },{ role: 'selectAll' },{ type: 'separator' },
				{id:98,label:'My resources',click:()=>{
					outside.openPath(path.join(app.getPath('userData'),userResourcesPath));
				}}
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
    submenu: [{ label: 'Hairs tool',accelerator: 'Ctrl+H',click:()=>{ mainWindow.webContents.send('preload:openModal','hairs')}},{label:'Microblend Lab',accelerator: 'Ctrl+B',click:()=>{ mainWindow.webContents.send('preload:openModal','micromanager')}},{ type: 'separator' },{ role: 'reload' },{ role: 'forceReload' },{ type: 'separator' },{ role: 'resetZoom' },{ role: 'zoomIn' },{ role: 'zoomOut' },{ type: 'separator' },{ role: 'togglefullscreen' },{ role: 'toggleDevTools' }]
  },
  { role: 'windowMenu' },
	/*
  {
    label: 'Window',
    submenu: [
			/*
			{label: 'Model Library',accelerator: 'CTRL+L',click:()=>{
						childWindow("apps/models.html",mainWindow,800,600,'Model Library', {preload: path.join(__dirname, 'apps/preloadmodel.js')} );
				}},
			{label: 'Databases Editor',click:()=>{
						childWindow("apps/editor.html",mainWindow,1200,600,'Databases Editor', {preload: path.join(__dirname, 'apps/preloaDb.js')} );
				}},
			{ type: 'separator' },{ role: 'minimize' },{ role: 'zoom' },
      ...(isMac ? [{ type: 'separator' },{ role: 'front' },{ type: 'separator' },{ role: 'window' } ] : [ { role: 'close' } ])
    ]
  },*/
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
	if (!!dev){
		mainWindow.webContents.openDevTools()
	}
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


ipcMain.on('main:giveModels',(event) => {
	//read custom models json file and try to inject it in the main body
	fs.readFile(path.join(app.getPath('userData'),'customModels.json'),(err,contenutofile) =>{
		if (err) {
			//maybethere is only no file to read
			//mainWindow.webContents.send('preload:logEntry', err)
			event.returnValue = []
		}else{
			try{
				customModels = JSON.parse(contenutofile)
				event.returnValue = customModels
			}catch(err){
				mainWindow.webContents.send('preload:logEntry', "Not a readable content for the file of the custom models",true)
				event.returnValue = []
			}
		}
	})
})
//read file on disk
ipcMain.on('main:readFile',(event,percorso,flags,no_repo)=>{
	var whereLoadFrom
	if (no_repo){
		whereLoadFrom = path.normalize(percorso)
	}else{
		whereLoadFrom = path.join(preferences.get('unbundle'),percorso)
	}

  fs.readFile(whereLoadFrom,flags,(err,contenutofile) =>{
    if (err) {
      if (err.code=='ENOENT'){
				if (normals.test(whereLoadFrom)){
					event.reply('preload:logEntry', 'normal map not found in : '+whereLoadFrom,true)
				}else{
					dialog.showErrorBox("File opening error","The searched file does not exists "+whereLoadFrom)
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
			buildMenu = wcliExecutable.test(preferences.get('wcli'),'i');
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
	if (arg.hasOwnProperty('legacymaterial')){
		preferences.set('legacymaterial',arg.legacymaterial);
	}
})


ipcMain.handle('main:loadMuBlend',(event) => {
	return MuReading()
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
								}else{
									event.reply('preload:logEntry', 'Operation executed, the file is saved there >'+salvataggio.filePath+'\nYou haven\'t setup a wolvenkit-cli executable to compile, so it\'s up to you the conversion')
									new Notification({title:"Conversion executed", body: "Your file has been saved in JSON format" }).show()
									event.reply('preload:noBar','')
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
	}else if(arg.type=='customlist'){
		fs.writeFile(path.join(app.getPath('userData'),arg.file), arg.content,'utf8',(errw, data) =>{
			if(errw){
				event.reply('preload:logEntry', 'Save procedure aborted',true)
				dialog.showErrorBox('Error during the writing process of the file')
				return
			}else{
				new Notification({title:"Save List", body: "Your file has been saved" }).show()
				event.reply('preload:logEntry', 'models list saved')
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

function uncookRun(toggle,params,stepbar,logger){
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
					mainWindow.webContents.send('preload:uncookErr',`${data}`,logger)
				}else{
						if (oldtxt != data.toString().split("%")[0]){
							oldtxt = data.toString().split("%")[0]

							if (oldtxt.length>4){
								mainWindow.webContents.send('preload:uncookErr',`${data}`,logger)
							}else{
								mainWindow.webContents.send('preload:uncookBar',oldtxt,stepbar)
							}
						}
				}

			});

			subproc.stderr.on('data', (data) => {
				mainWindow.webContents.send('preload:logEntry',`stderr: ${data}`,true)
				mainWindow.webContents.send('preload:uncookErr',`${data}`,logger)
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
						case 'step7':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Decals uncooked</span>')
							break;
						case 'step9':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Fonts exported</span>')
							break;
						case 'micro_opt01':
						case 'micro_opt02':
						case 'micro_opt03':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Microblends step done</span>','#microLogger')
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
					let unbundlefoWkit = preferences.get('unbundle') //String(preferences.get('unbundle')).replace(/base$/,'')
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
								.then(()=>uncookRun(conf[3],["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_appearance.archive'), "-r","^base.characters.common.textures.decals.+\.xbm$","--uext","png","-o",unbundlefoWkit],'step7'))
								.then(()=> {
									return new Promise((resolve,reject) =>{
										if (conf[3]){
											fs.readdir(path.join(String(preferences.get('unbundle')),'base/characters/common/textures/decals/'),(err,files)=>{
												if (err){
														mainWindow.webContents.send('preload:uncookErr',`${err}`,'#uncookLogger')
														reject()
											  }else {
													var decalfiles = []
													files.forEach((el)=>{
														if (el.match(/garment_decals_[d|n]\d{2}\.png$/))
														decalfiles.push(el)
													})
													mainWindow.webContents.send('preload:uncookErr','Found '+decalfiles.length+' decals to process','#uncookLogger')
													resolve(decalfiles)
												}
											})
										}else{
											resolve([])
										}
									})
								})
								.then((files)=>{
									try{
										var perc = Number(100/files.length).toFixed(2)
										var k = 0
										files.forEach((png)=>{
											if (/.+n\d{2}\.png$/.test(png)){
												k++
												sharp(path.join(String(preferences.get('unbundle')),'base/characters/common/textures/decals/',png))
												.raw()
												.toBuffer({ resolveWithObject: true })
											  .then(({ data, info }) => {
													const { width, height, channels } = info;
													for (let i = 0, l=data.length; i < l; i += 4) {
													 data[i + 2] = 255;  // B value
												 	}
													sharp(data, { raw: { width, height, channels } })
													.toFile(path.join(app.getAppPath(),'images/cpsource/',png), (err, info) => {
														 if(err){
															 mainWindow.webContents.send('preload:uncookErr',`${err}`,'#uncookLogger')
														 }
													 })
												})
											  .catch(err => { console.log(err) })
											}else{
												sharp(path.join(String(preferences.get('unbundle')),'base/characters/common/textures/decals/',png))
													.toFile(path.join(app.getAppPath(),'images/cpsource/',png), (err, info) => {
														 if(err){
															 mainWindow.webContents.send('preload:uncookErr',`${err}`,'#uncookLogger')
														 }else{
															 k++
															 mainWindow.webContents.send('preload:uncookBar',String(Math.round(Number(perc * k))),'step8')
														 }
													  })
											}

										})
										if (conf[3]) mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Decals copied and edited</span>')
									}catch(err){
										if (conf[3]) mainWindow.webContents.send('preload:uncookErr',`${err}`,'#uncookLogger')
									}
								})
								.then(()=>{ mainWindow.webContents.send('preload:stepok',"#arc_DEC4") })
								.then(()=>uncookRun(conf[4],["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_gamedata.archive'), "-r","^base.gameplay.gui.fonts.+\.fnt$","-o",unbundlefoWkit,"-or",unbundlefoWkit],'step9'))
								.then(()=>{ mainWindow.webContents.send('preload:stepok',"#arc_FNT4")})
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
					let unbundlefoWkit = preferences.get('unbundle') //String(preferences.get('unbundle')).replace(/base$/,'')
					let uncooker = preferences.get('wcli')
					var countingOnYou = 0

					if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
						mainWindow.webContents.send('preload:uncookLogClean','#microLogger')

						uncookRun(true,["uncook", "-p", path.join(selection.filePaths[0],'basegame_1_engine.archive'), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt01','#microLogger')
							.then(()=> 	uncookRun(true,["uncook", "-p", path.join(selection.filePaths[0],'basegame_3_nightcity.archive'), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt02','#microLogger'))
							.then(()=> 	uncookRun(true,["uncook", "-p", path.join(selection.filePaths[0],'basegame_4_gamedata.archive'), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt03','#microLogger'))
							.then(()=> {
								return new Promise((resolve,reject) =>{
									fs.readdir(path.join(String(preferences.get('unbundle')),'base/surfaces/microblends/'),(err,files)=>{
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

										sharp(path.join(String(preferences.get('unbundle')),'base/surfaces/microblends/',png))
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

ipcMain.on('main:mBlender',(event,package)=>{
	var pathPackage = path.join(app.getPath('userData'),userResourcesPath,userRScheme[_microblends],package.packageName.toLowerCase())
	var folderPackage = path.join(app.getAppPath(),'images/mblend/',package.packageName.toLowerCase())

	try{
		if (package.files.length>0){
			if (!fs.existsSync(folderPackage)){
				fs.mkdirSync(path.join(folderPackage,'/thumbs/'), { recursive: true}, (err) => {
					if (err) {dialog.showErrorBox("The folder isn't accessible, trying to create one : -",err.message)}
				})
			}
			if (!fs.existsSync(pathPackage)){
				fs.mkdirSync(pathPackage, { recursive: true }, (err) => {
					if (err) {dialog.showErrorBox("The folder isn't accessible, trying to create one : -",err.message)}
				})
			}

			package.files.forEach((mblend,index)=>{
				if (!fs.existsSync(path.join(pathPackage,mblend.name))){
					sharp(path.normalize(mblend.source))
					.resize(256)
					.toFile(path.join(pathPackage,mblend.name), (err, info) => {
						 if(err){
							 mainWindow.webContents.send('preload:logEntry',`${err}`,true)
						 }else{
							 mainWindow.webContents.send('preload:logEntry',`Wrote backup to ${path.join(pathPackage,mblend.name)}`)
						 }
					})
					.toFile(path.join(folderPackage,mblend.name), (err, info) => {
						 if(err){
							 mainWindow.webContents.send('preload:logEntry',`${err} `,true)
						 }else{
							 mainWindow.webContents.send('preload:logEntry',`${mblend.name} processed for package ${package.packageName}`)
						 }
					})
					.resize(64)
					.toFile(path.join(folderPackage,'/thumbs/',mblend.name), (err, info) => {
							if(err){
								mainWindow.webContents.send('preload:logEntry',`${err}`,true)
							}else{
								mainWindow.webContents.send('preload:logEntry',`Thumbs for ${mblend.name} processed for package ${package.packageName}`)
							}
					 })
				}
			})
			MuReading()
			.then((contenuto)=>{
				let listaPath = package.files.map(elm => {return {"path":elm.gamepath,"hash":elm.hash}})
				let indexPackage = contenuto.packages.findIndex((pkg,index) => { if (pkg.name==package.packageName){ return index	}})
				if (indexPackage>=0){
					//TODO push only the microblends not already there
					//listaPath.filter(elm => contenuto.packages[indexPackage].microblends)
					let myBlock = contenuto.packages[indexPackage].microblends.map(mb => mb.path)

					listaPath.forEach((file, index)=>{
						if (!myBlock.includes(file.path)){
							contenuto.packages[indexPackage].microblends.push({"path":file.path})
						}
					})
				}else{
					contenuto.packages.push({"name":package.packageName,"microblends":listaPath})
				}

				MuWriting(JSON.stringify(contenuto,null,"  "))
				.then((e) =>event.reply('preload:packageDone',true))
				.catch((error)=>{ event.reply('preload:logEntry',`${error}`) })
			})
			.catch((error)=>{ event.reply('preload:logEntry',`${error}`) })
		}
	}catch(error){
		event.reply('preload:logEntry',`${error}`)
		event.reply('preload:packageDone',false)
	}
})

ipcMain.on('main:delmBlend', (event,micro)=>{
	var pathPackage = path.join(app.getPath('userData'),userResourcesPath,userRScheme[_microblends],micro.package.toLowerCase())
	var folderPackage = path.join(app.getAppPath(),'images/mblend/',micro.package.toLowerCase())

	try{
		//remove the files
		fs.rm(path.join(pathPackage,micro.file), (err, info) => {
			if (err){
				mainWindow.webContents.send('preload:logEntry',`${err}`,true)
			}
		})
		fs.rm(path.join(folderPackage,micro.file), (err, info) => {
			if (err){
				mainWindow.webContents.send('preload:logEntry',`${err}`,true)
			}
		})
		fs.rm(path.join(folderPackage,"/thumbs/",micro.file), (err, info) => {
			if (err){
				mainWindow.webContents.send('preload:logEntry',`${err}`,true)
			}
		})
		//delete from the Mbcustom.json the entry
		MuReading()
		.then((contenuto)=>{
			let indexPackage = contenuto.packages.findIndex((pkg,index) => { if (pkg.name==micro.package){ return index	}})
			let toremove
			if (indexPackage>=0){

				//TODO push only the microblends not already there
				if (toremove = contenuto.packages[indexPackage].microblends.findIndex((pkg,index) => { if (pkg.path==micro.path){ return index	}})){
					contenuto.packages[indexPackage].microblends.splice(toremove,1)
				}else{
					mainWindow.webContents.send('preload:logEntry',`${error}`,true)
				}

				if (contenuto.packages[indexPackage].microblends.length==0){
					contenuto.packages.splice(indexPackage,1)
				}

				MuWriting(JSON.stringify(contenuto,null,"  "))
				.then(()=>{
					event.reply('preload:MuReload',true)
				})
				.catch((error)=>{ mainWindow.webContents.send('preload:logEntry',`${error}`,true) })
			}
		})
		.catch((error)=>{ mainWindow.webContents.send('preload:logEntry',`${error}`,true) })

	}catch(error){
		mainWindow.webContents.send('preload:logEntry',`${error}`,true)
	}

})


ipcMain.on('main:scanFolder',()=>{
	var archives = dialog.showOpenDialog({title:'Select a folder you want to scan',properties: ['openDirectory'],defaultPath:app.getPath('recent')})
		.then(selection => {
			if (!selection.canceled){
				if (selection.filePaths[0] == preferences.get('unbundle')){
					mainWindow.webContents.send('preload:scanreply',"");
				}else{
					var foldertree = dree.scanAsync(selection.filePaths[0],dreeOptions)
					foldertree.then( tree_leaf => {
						mainWindow.webContents.send('preload:scanReply',JSON.stringify(tree_leaf));
					});
				}
			}
		});
})

ipcMain.on('main:openFolder',(event,folder)=>{
	outside.showItemInFolder(path.normalize(folder));
})

ipcMain.on('main:WindopenExt',(event,resource)=>{
	switch (resource?.type){
		case 'video':
			if (resource?.param=='vid_001'){
				outside.openExternal("https://youtube.com/playlist?list=PLViyQUe4oow0l-amhDzneys9nzJxyH64n");
			}else if (resource?.param=='vid_002') {
				outside.openExternal("https://youtu.be/uCOHjMPvpgc");
			}
			break
		case 'url':
			if (resource?.param=='ko-fi'){
				outside.openExternal("https://ko-fi.com/neurolinked99888");
			}else if (resource?.param=='redwiki') {
				outside.openExternal("https://wiki.redmodding.org/cyberpunk-2077-modding/developers/modding-tools/mlsetup-builder");
			}
			break
		default:
			break
	}
})
