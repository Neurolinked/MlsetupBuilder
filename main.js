// main.js
// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, screen, Notification, ipcMain, nativeTheme, dialog, Menu } = require('electron')
var child = require('child_process').execFile;
var spawner = require('child_process').spawn;
const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const store = require('electron-store'); //https://github.com/sindresorhus/electron-store#readme
const sharp = require('sharp');
const dree = require('dree');
const outside = require('electron').shell;
//app.commandLine.appendSwitch('enable-unsafe-webgpu') //enable access to the WebGPU interface adapter
app.commandLine.appendSwitch('enable-gpu') //enable acceleration
app.commandLine.appendSwitch('disable-features', 'WidgetLayering'); //minor fixes for console layering not working as intended

var subproc

const dreeOptions = {
	stat:false,
	followLinks:false,
	hash:true,
	sizeInBytes: false,
	size: false,
	extensions: ["glb"],
	normalize:true,
	excludeEmptyDirectories:true
}

const _microblends = 0
const _decals = 1
const _jsons = 2

var contentpath
var customModels
var userResourcesPath = '/_Migrate/'
var userRScheme = [
		'mblend',
		'decals',
		'jsons'
		]
var userRfiles = {
	masks : 'masklist',
	microblends : 'mbcustom',
	mat_template : 'material_template'
}

var objwkitto = {}
const schema = {
	maskformat:{
		type: 'string',
		default: 'png'
	},
	legacymaterial:{
		type:'boolean',
		default: false
	},
	usermigration:{
		type:'boolean',
		default: false
	},
	flipmasks:{
		type:'boolean',
		default: false
	},
	flipnorm:{
		type:'boolean',
		default: false
	},
	workspace:{
		type:'number',
		default: 0
	},
	paths:{
		type:'object',
		default : {
			depot: '',
			game:'',
			lastmod: '',
			wcli:''
		}
	},
	editorCfg : {
		type:'object',
		default: {
			layer:{
				tiles:{
					default: 150.0,
					value: 150.0
				}
			},
			mblend:{
				tiles:{
					default: 150.0,
					value: 150.0
				},
				contrast:{
					default: 1.0,
					value: 1.0
				},
				normal:{
					default: 2.0,
					value: 2.0
				}
			}
		}
	}
};

const wolvenkitPrefFile = path.join(app.getPath('appData'),'REDModding/WolvenKit/config.json');

const preferences = new store({schema,
	migrations: {
		'<=1.6.2': store => {
			if (store.has('unbundle') && (!store.has('pathfix'))){
				let fixstring = store.get('unbundle')
				store.set('unbundle',fixstring.replace(/\\base$/,''))
				store.set('pathfix','1')
			}
		},
		'1.6.3': store =>{
			store.delete('pathfix')
			store.set('legacymaterial',false)
		},
		'1.6.6': store =>{
			store.set('game','')
			store.set('depot','')
		},
		'1.6.7': store =>{
			if (store.get('depot')==''){
				//preparing for the switch from the unbundle folder, to the depot one
				let fixVal = store.get('unbundle')
				store.set('depot', fixVal)
			}
			store.set('flipmasks',false)
			store.set('flipnorm',false)
		},
		'1.6.8': store =>{
			store.set('workspace', 0),
			store.set({
				editorCfg:{
					layer:{
						tiles:{
							default: 150.0,
							value: 150.0
						}
					},
					mblend:{
						tiles:{
							default: 150.0,
							value: 150.0
						},
						contrast:{
							default: 1.0,
							value: 1.0
						},
						normal:{
							default: 2.0,
							value:2.0
						}
					}
				}
			})
			
			var fixGamePath = store.get('game');
			if (fixGamePath!=''){
				fixGamePath = fixGamePath.replace("\\archive\\pc\\content","")
			}
			store.set({
				paths:{
						depot: store.get('depot'),
						game:fixGamePath,
						lastmod: '',
						wcli: store.get('wcli')
					}
				})
			store.delete("depot")
			store.delete("game")
			store.delete("unbundle")
			store.delete("wcli")
		}
	}
});

var spotfolder={
	base: "archive/pc/content",
	pl: "archive/pc/ep1"
}

var archives={
	engine : "basegame_1_engine.archive",
	nightcity : "basegame_3_nightcity.archive",
	appearances : "basegame_4_appearance.archive",
	gamedata : "basegame_4_gamedata.archive"
}

preferences.watch = true
var mainWindow,aimWindow

var mljson = app.commandLine.getSwitchValue("open")
if (mljson ==''){
  mljson = app.commandLine.getSwitchValue("o")
}

var wkitto = app.commandLine.getSwitchValue("wkit")
var dev = app.commandLine.getSwitchValue("dev")

var lastMicroConf = {}

//register the application name
if (process.platform === 'win32'){ app.setAppUserModelId(app.name); }

/*Read the custom Microblends from the resource list*/

/*Write the custom Microblends to the resource list*/
function MuWriting(contenuto){
	return new Promise((resolve,reject) =>{
		let app_custom_json = path.join(app.getAppPath(),userRScheme[_jsons],`/${userRfiles.microblends}.json`)/* application file  */
		let bk_custom_json = path.join(app.getPath('userData'),userResourcesPath,userRScheme[_jsons],`/${userRfiles.microblends}.json`) /* application file  */

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

function JsonResourceRead(UserResource){
	return new Promise((resolve,reject) =>{
		let app_custom_json = path.join(app.getAppPath(),userRScheme[_jsons],`/${UserResource}.json`)/* application file  */
		fs.readFile(app_custom_json,(err,filecontent) =>{
			if (err) {
				reject()
			}else{
				try{
					let strutcontent = JSON.parse(filecontent)
					resolve(strutcontent)
				}catch(err){
					reject()
				}
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

function SaveCustom(){
	let toMigration = path.join(app.getPath('userData'),userResourcesPath)
	let applicationDest = app.getAppPath()
	try {
		if (!fs.existsSync(toMigration)){
			//nothing to Save, the folder to migrate isn't there
			customResource()
		}
		userRScheme.forEach((item, i) => {

			let dirToSaveTo = path.join(toMigration,item)
			switch (item){
				case 'decals':
					fse.copySync(path.join(applicationDest,"/images/","cpsource"),dirToSaveTo)
					break
				case 'mblend':
					fse.copySync(path.join(applicationDest,"/images/",item),dirToSaveTo)
					break
				case 'jsons':
					fse.copySync(path.join(applicationDest,item,"mbcustom.json"),path.join(dirToSaveTo,`${userRfiles.microblends}.json`))
					break
			}
		})
		new Notification({title:'Save custom datas',body: "The custom datas in MLSB have been restored" }).show()
	}catch(error){
		dialog.showErrorBox("Saving Error",error)
	}
}
//port datas from the previous version of MLSB
function restoreCustom(){
	let fromMigration = path.join(app.getPath('userData'),userResourcesPath)
	let applicationDest = app.getAppPath()
	try {
		if (!fs.existsSync(fromMigration)){
			//nothing to restore, the folder three will be created
		}else{
			userRScheme.forEach((item, i) => {
				let dirToVerify = path.join(fromMigration,item)
				switch (item){
					case 'decals':
						fse.copySync(dirToVerify,path.join(applicationDest,"images","cpsource"))
						break
					case 'mblend':
						fse.copySync(dirToVerify,path.join(applicationDest,"images",item))
						break
					case 'jsons':
						fse.copySync(path.join(dirToVerify,`${userRfiles.microblends}.json`),path.join(applicationDest,item,"mbcustom.json"))
						break
				}
			})
			new Notification({title:'Restore custom datas',body: "The datas you had saved in your resource folder are now restored" }).show()
		}
	}catch(error){
		dialog.showErrorBox("Restore Error ",error)
	}
}

async function dirOpen(event,arg) {
	const {canceled,filePaths } = await dialog.showOpenDialog({title:arg.title, properties: ['openDirectory'], defaultPath:path.normalize(arg.path)})
	if (canceled){
		return
	}else{
		return filePaths[0]
	}
}

//Verify the folders to restore Materials from
customResource()

const createModal = (htmlFile, parentWindow, width, height, title='MlsetupBuilder', preferences,frameless=true) => {
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

const childWindow = (htmlFile, parentWindow, width, height, title='MlsetupBuilder', preferences, ico='') => {
	let mywin = new BrowserWindow({
		width: width,
		height: height,
		modal: false,
		icon: ico,
		parent: parentWindow,
			webPreferences: preferences,
			title: title,
			alwaysOnTop : false
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
var buildMenu = wcliExecutable.test(preferences.get('paths.wcli'),'i');

function openSettings(){
	createModal("apps/prefs.html",mainWindow,800,350,'Preferences', {preload: path.join(__dirname, 'apps/preloadpref.js')} );
}

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
			{
			label: 'Mlsetup',
			submenu: [
					{label: 'Import',accelerator: 'Ctrl+i', click: () =>{
						mainWindow.webContents.send('preload:activate','#importTech')
					}},
					{label: 'Export',accelerator: 'Ctrl+e', click: () =>{
						mainWindow.webContents.send('preload:activate','#exportversions')
					}}
			]
      		},
			{
				label: 'Recent',
				submenu:[]
			},
			{ type: 'separator' },
			{label: '&Preferences', click: () =>{ openSettings() }},
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
				{ role: 'pasteAndMatchStyle' },{ role: 'delete' },{ type: 'separator' },{label: 'Speech',submenu: [{ role: 'startSpeaking' },{ role: 'stopSpeaking' }]}
      ] : [
        { role: 'delete' }
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
    submenu: [
			{label: 'Material Composer',accelerator: 'Ctrl+K',click:()=>{
				childWindow("apps/materials.html",mainWindow,1200,800,'Material Composer', {preload: path.join(__dirname, 'apps/preloadmats.js')} );
			}},
			{label: 'Hairs tool',accelerator: 'Ctrl+H',click:()=>{ mainWindow.webContents.send('preload:openModal','hairs')}},
			{label:'Microblend Lab',accelerator: 'Ctrl+B',click:()=>{ mainWindow.webContents.send('preload:openModal','micromanager')}},
			{label:'Logs',click:()=>{ mainWindow.webContents.send('preload:openModal','log')}},
			{label:'Websocket communicator', click: ()=>childWindow("apps/websocket.html",mainWindow,600,400,'Websocket communicator',{preload: path.join(__dirname,'apps/preloadws.js')})},
			{type: 'separator' },{ role: 'reload' },{ role: 'forceReload' },{ type: 'separator' },{ role: 'resetZoom' },{ role: 'zoomIn' },{ role: 'zoomOut' },{ type: 'separator' },{ role: 'togglefullscreen' },{ role: 'toggleDevTools' },
		]
  },
	{ label:'Utils',
		submenu: [
			{id:98,label:'My resources',click:()=>{
				outside.openPath(path.join(app.getPath('userData'),userResourcesPath));
			}},
			{type: 'separator' },
			{label:'Save custom resources',click:()=>{SaveCustom()}},
			{label:'Restore custom resources',click:()=>{restoreCustom()}}
		]
 	},
  { role: 'windowMenu' },
  {
    role: 'help',
    submenu: [
		{	label:'Documentation',
			accelerator: 'F1',
			click:()=>{
				mainWindow.webContents.send('preload:openModal','help')
			}
		},
		{	label:'Download Wolvenkit.CLI',
			click:()=>{
				//Download the stable version
				mainWindow.webContents.downloadURL(`https://github.com/WolvenKit/WolvenKit-nightly-releases/releases/download/8.12.3-nightly.2024-02-17/WolvenKit.Console-8.12.3-nightly.2024-02-17.zip`);
			}
		},
		{	label:'License',click: () =>{
				mainWindow.webContents.send('preload:openModal','license')
			}
		}
	]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createWindow (width,height) {
	width = parseInt((width/100)*95)

  // Create the browser window.
   mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webgl:true,
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  nativeTheme.themeSource = 'dark';
  // Open the DevTools.
	if (dev){
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
 // Create a window that fills the screen's available work area.
 const primaryDisplay = screen.getPrimaryDisplay()
 const { width, height } = primaryDisplay.workAreaSize

  createWindow(width,height)
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow(width,height)
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


app.on('browser-window-focus', () => {
	globalShortcut.register("CommandOrControl+W", () => {
	//stuff here
	})
	/*
	globalShortcut.register("CommandOrControl+A",() => {
		mainWindow.webContents.send('preload:activate', '#applytoMyLayer')
	})
	*/
})

app.on('browser-window-blur', () => {
	globalShortcut.unregisterAll()
})

ipcMain.on('main:aimMicros',(event,configurations) =>{
	lastMicroConf = configurations
	aimWindow = createModal("apps/aiming.html",mainWindow,1380,802,'Microblends aiming', {preload: path.join(__dirname, 'apps/preloadaim.js')});
})

ipcMain.on('main:reloadAim',()=>{
	aimWindow.webContents.send('preload:configure',lastMicroConf)
});

ipcMain.on('main:clickMenu',(event,menuVoice)=>{
	if (menuVoice=='preferences'){
		openSettings();
	}
});

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
ipcMain.on('main:readSyncFile',(event,percorso,flags,no_repo)=>{
	var whereLoadFrom
	if (no_repo){
		whereLoadFrom = path.normalize(percorso)
	}else{
		whereLoadFrom = path.join(preferences.get('paths.depot'),percorso)
	}
	var a3dMatModel = whereLoadFrom.search(/^.+\.glb$/g)>-1 ? whereLoadFrom: ``; //path of the hypotethical material file
	var hasDepot = preferences.get('paths.lastmod')!=preferences.get('paths.depot') ? true : false
  	fs.readFile(whereLoadFrom,flags,(err,contenutofile) =>{
    	if (err) {
      		if (err.code=='ENOENT'){
				if (hasDepot){

					event.reply('preload:logEntry', `Missing file - ${whereLoadFrom} - trying in the Depot Folder`)
					whereLoadFrom = path.join(preferences.get('paths.lastmod'),percorso)

					fs.readFile(whereLoadFrom,flags,(err,contenutofile) =>{
						if (err){
							if (err.code=='ENOENT'){
								if (whereLoadFrom){
									event.reply('preload:logEntry', `File not found in: ${whereLoadFrom}`,true)
								}else{
									dialog.showErrorBox("File opening error",`The searched file does not exists also in the Depot ${whereLoadFrom}`)
									event.reply('preload:logEntry', `Missing file - ${whereLoadFrom}`,true)
								}
							}
							contenutofile=""
							a3dMatModel="";
							if (whereLoadFrom.match(new RegExp(/.+\.glb$/))){
								mainWindow.webContents.send('preload:request_uncook')
							}
						}else{
							event.reply('preload:logEntry', 'File found in the Depot Folder, Yay')
						}
					})
				}else{
					if (normals.test(whereLoadFrom)){
						event.reply('preload:logEntry', 'File not found in : '+whereLoadFrom,true)
					}else{
						a3dMatModel="";
						if (whereLoadFrom.match(new RegExp(/.+\.glb$/))){
							dialog.showErrorBox("File opening error","The searched file does not exists \n"+whereLoadFrom)
						}
						event.reply('preload:logEntry', 'Missing file - '+whereLoadFrom,true)
					}
					contenutofile = ""
					if (whereLoadFrom.match(new RegExp(/.+\.glb$/))){
						mainWindow.webContents.send('preload:request_uncook')
					}
				}
			}else{
				dialog.showErrorBox("File opening error",err.message)
				a3dMatModel="";
			}
			contenutofile=""
		}
		event.reply('preload:logEntry', `File loaded: ${whereLoadFrom}`)
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
          event.reply('preload:load_source',mlsetup_content, mljson)
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

//setup the version of the software where needed
ipcMain.on('main:getversion',(event, arg) =>{
	event.reply('preload:setversion',app.getVersion())
	/*
		Since it's the first operation requested from the renderer
		And it's expected the store to be already initialized, i will
		test the values for Depot and Game Archives and if they are empty
		i will look for the Wolvenkit configuration file, to setup the
		preferences
	*/
	if (preferences.get('paths.depot')==""){
		fs.readFile(path.normalize(wolvenkitPrefFile),(err,wolvenkitConfigHandle)=>{
			if (err){
				event.reply('preload:logEntry',`No traces of Wolvenkit installation`,false);
			}else{
				try {
					var WolvenkitConfig = JSON.parse(wolvenkitConfigHandle)
					if (WolvenkitConfig.hasOwnProperty('MaterialRepositoryPath')){
						preferences.set(`depot`,WolvenkitConfig.MaterialRepositoryPath);
					}
					if ((WolvenkitConfig.hasOwnProperty('CP77ExecutablePath')) && (preferences.get(`game`)=='')) {
						preferences.set(`game`,WolvenkitConfig.CP77ExecutablePath.replace("\\bin\\x64\\Cyberpunk2077.exe","\\archive\\pc\\content"))
					}
				} catch (error) {
					event.reply('preload:logEntry',`The file is there, but i got an error:${error}`,false);
				}
			}
		})
	}
})

ipcMain.handle('main:folderSetup',dirOpen)
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

ipcMain.on('main:pickWkitPorject',(ev)=>{
	const result = dialog.showOpenDialog({
		title:'Choose a Wolvenkit Project file',
		filters:[ { name: 'Wolvenkit Project', extensions: ['cpmodproj'] }],
	}).then(result => {
	if (!result.canceled){
		var dirPath = path.dirname(result.filePaths[0]);
		preferences.set('paths.lastmod',dirPath);
	 	ev.reply('preload:set_new_modPath',dirPath);
	}
  }).catch(err => {
	dialog.showErrorBox("File picking error",err.message)
  })
});

//dialog To choose a mlmask file
ipcMain.on('main:pickMlmask',(event, arg) => {
	const result = dialog.showOpenDialog({
		  title:'Choose a mask file',
		  filters:[ { name: 'Mulitlayer Mask List', extensions: ['mlmask'] }],
		  defaultPath:arg
	  }).then(result => {
	  if (!result.canceled){
		event.reply('preload:set_new_mask_name',result.filePaths[0]);
	  }
	}).catch(err => {
	  dialog.showErrorBox("Preferences setup error",err.message)
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
			buildMenu = wcliExecutable.test(preferences.get('paths.wcli'),'i');
    }
  }).catch(err => {
    dialog.showErrorBox("Preferences setup error",err.message)
  })
})

ipcMain.on('main:3dialog',(event, arg) => {
	const result = dialog.showOpenDialog({
		title:'Load a 3d asset',
		filters:[{ name: 'GL Transmission Format', extensions: ['glb','gltf'] }],
		properties :['openFile']
	}).then(threeDAsset => {

    if (!threeDAsset.canceled){
			event.reply('preload:logEntry', 'File choosen : '+threeDAsset.filePaths[0]+'<br/>')
			event.reply('preload:set_3d_asset_name',threeDAsset.filePaths[0]);
    }else{
		event.reply('preload:logEntry', 'Action cancelled')
		event.reply('preload:enable','#cstMdlLoader');
	}
  }).catch(err => {
    dialog.showErrorBox("Error reading the file :",err.message)
	event.reply('preload:enable','#cstMdlLoader')
  })
  
})

//Save the preferences
ipcMain.on('main:saveStore',(event, arg) => {
	if (arg.hasOwnProperty('editorCfg')){
		//MMMMMMM to be reworked
		preferences.set('editorCfg.layer.tiles.value',arg.editorCfg.layer.tiles.value);
		preferences.set('editorCfg.mblend.tiles.value',arg.editorCfg.mblend.tiles.value);
		preferences.set('editorCfg.mblend.contrast.value',arg.editorCfg.mblend.contrast.value);
		preferences.set('editorCfg.mblend.normal.value',arg.editorCfg.mblend.normal.value);
	}else{
		/*
		Get the object property and cycle them, test if they are there
		then they are been setup
		*/
		var Arguments = Object.keys(arg);
		Arguments.forEach((setting)=>{
			if (preferences.has(setting)){
				preferences.set(setting, arg[setting]);
			}
		});
	}
})


ipcMain.handle('main:loadUseRSource',(event,type)=>{
	switch (type) {
		case 'microblends':
			return JsonResourceRead(userRfiles.microblends)
		case 'masks':
			return JsonResourceRead(userRfiles.masks)
		default:
			return new Promise((resolve,reject) =>{ reject() })
	}
});

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
			filters:[ { name: 'All Files', extensions: ['*'] },	{ name: 'Mlsetup jsons', extensions: ['mlsetup.json'] } ],
			properties: ['createDirectory']
		}).then(salvataggio => {
		    if (!salvataggio.canceled){
					fs.writeFile(salvataggio.filePath, arg.content,'utf8',(errw,data) =>{
						if(errw){
							event.reply('preload:noBar','')
							dialog.showErrorBox('Error during the writing process of the file')
							return
						}else{
							if ((!objwkitto.hasOwnProperty('major')) && (arg.compile) ){
								let test = preferences.get('paths.wcli')
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
								 new Notification({title:"Conversion executed", body: "Your file has been saved, remember to convert it back in Wolvenkit." }).show()
								 event.reply('preload:noBar','')
								 //do not exit automatically if (objwkitto.hasOwnProperty('major')){	app.exit(0) 	}
							}
						}
					})
					event.reply('preload:logEntry', 'File saved in: '+salvataggio.filePath+'\n')
				}else{
					event.reply('preload:noBar','')
					event.reply('preload:logEntry', 'Save procedure cancelled')
				}
		})
	}else if (arg.type=='customlist'){
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
	}else if (arg.type=='materialLibrary'){
		let app_matLib = path.join(app.getAppPath(),userRScheme[_jsons],arg.file)/* application file  */
		let bk_matLib = path.join(app.getPath('userData'),userResourcesPath,userRScheme[_jsons],arg.file)/* application file  */

		fs.writeFile(app_matLib, arg.content,(err) =>{
			if (err) {
				new Notification({title:"Save", body: "Your material template library has encounter an error during the save process" }).show()
				mainWindow.webContents.send('preload:logEntry', "Your material template library has encounter an error during the save process",true)
			}else{
				new Notification({title:"Save", body: "Your material template library has been saved" }).show()
				fs.copyFile(app_matLib,bk_matLib,fs.constants.COPYFILE_FICLONE,(err) =>{
					if (err) {
						mainWindow.webContents.send('preload:logEntry', "it's impossible to create the template material Library backup",true)
					}
				})
			}
		})
	}else if (arg.type=='materialBuffer'){
		const salvataggio = dialog.showSaveDialog({
			title:'Save the .Material.json file',
			defaultPath: def_path,
			filters:[ { name: 'All Files', extensions: ['*'] },	{ name: 'Mesh materials source file', extensions: ['Material.json'] } ],
			properties: ['createDirectory']
		}).then(salvataggio => {
			if (!salvataggio.canceled){
				fs.writeFile(salvataggio.filePath, arg.content,'utf8',(errw,data) =>{
					if(errw){
						dialog.showErrorBox('Error during the writing process of the file')
						return
					}else{
						event.reply('preload:logEntry', 'Operation executed, the file is saved there >'+salvataggio.filePath)
						new Notification({title:"Remember", body: "Your file has been saved in Material.json format import it back with Wolvenkit" }).show()
					}
				})
			}else{
				event.reply('preload:logEntry', 'Save procedure cancelled')
			}
		}).catch((error)=>{
			mainWindow.webContents.send('preload:logEntry', "it's impossible to create the template material Library backup",true)
		})
	}else if (arg.type=='maskslist'){
		fs.writeFile(path.join(app.getAppPath(),userRScheme[_jsons],`/${userRfiles.masks}.json`), arg.content,'utf8',(errw, data) =>{
			if(errw){
				event.reply('preload:logEntry', 'Save procedure aborted',true)
				dialog.showErrorBox('Error during the writing process of the file')
				return
			}else{
				new Notification({title:"Save List", body: "Your file has been saved" }).show()
				event.reply('preload:logEntry', 'custom mask list saved')
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

ipcMain.on('main:modelExport',(event,conf)=>{
	let unbundlefoWkit = preferences.get('paths.depot')
	let uncooker = preferences.get('paths.wcli')
	var contentpath = preferences.get('paths.game')

	if (conf.match(/^ep1\\.+/)){
		contentpath = path.join(contentpath,spotfolder.pl);
	}else{
		contentpath = path.join(contentpath,spotfolder.base);
	}

	console.log(contentpath,conf);

	var exportFormatGE = preferences.get('maskformat')

	fs.access(path.normalize(unbundlefoWkit),fs.constants.W_OK,(err)=>{
		if (err){
			// The folder isn't accessible for writing
			dialog.showErrorBox("It seems that you can't write in your unbundle folder. Try to check your permissions for that folder ",err.message)
		}else{
			if (contentpath==''){
				event.reply('preload:logEntry',`Path content of the game isn't setup, how can i extract things ? Go into settings and configure it, then reload and retry`,true)
			}else{
				event.reply('preload:logEntry',`Searching for the file in the whole archive, be patient`,true);
				if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
					uncookRun(true,["uncook", "-p", contentpath, "-w", path.normalize(conf),"--mesh-export-type", "MeshOnly", "--uext", exportFormatGE, "-o",unbundlefoWkit,"-gp", contentpath ],false,'#NotificationCenter .offcanvas-body')
					.then(()=>{
						event.reply('preload:logEntry',"Export of the model Done, reload");
						mainWindow.webContents.send('preload:noBar','');
						mainWindow.webContents.send('preload:activate','#btnMdlLoader');
					}).catch(err => { console.log(err) });
				}else{
					event.reply('preload:logEntry',`Wolvenkit.CLI isn't selected in the settings`,true)
				}
			}

		}
	})
})

/*
function checkMakeSymlinks(){
	return new Promise((resolve,reject) =>{
		
		phantomLFolder= path.join(preferences.get("paths.game"),spotfolder.pl)
		try{
			if (!fs.existsSync(path.join(phantomLFolder,"basegame_3_nightcity.archive"))){
				//try to create it
				fs.symlink(
					path.join(preferences.get("paths.game"),spotfolder.base,"basegame_3_nightcity.archive"),
					path.join(phantomLFolder,"basegame_3_nightcity.archive"),
					"file",
					(err)=>{
						if (err){
							mainWindow.webContents.send('preload:logEntry',`stderr: ${err}`,true);
						}else{
							mainWindow.webContents.send('preload:logEntry',`symlink 1 created`,false);
						}
					});
			}
			if (!fs.existsSync(path.join(phantomLFolder,"basegame_4_appearance.archive"))){
				//try to create it
				fs.symlink(
					path.join(preferences.get("paths.game"),spotfolder.base,"basegame_4_appearance.archive"),
					path.join(phantomLFolder,"basegame_4_appearance.archive"),
					"file",
					(err)=>{
						if (err){
							mainWindow.webContents.send('preload:logEntry',`stderr: ${err}`,true);
						}else{
							mainWindow.webContents.send('preload:logEntry',`symlink 2 created`,false);
						}
					});
			}
			if (!fs.existsSync(path.join(phantomLFolder,"basegame_4_gamedata.archive"))){
				//try to create it
				fs.symlink(
					path.join(preferences.get("paths.game"),spotfolder.base,"basegame_4_gamedata.archive"),
					path.join(phantomLFolder,"basegame_4_gamedata.archive"),
					"file",
					(err)=>{
						if (err){
							mainWindow.webContents.send('preload:logEntry',`stderr: ${err}`,true);
						}else{
							mainWindow.webContents.send('preload:logEntry',`symlink 3 created`,false);
						}
					});
			}
			resolve()
		}catch(err){
			mainWindow.webContents.send('preload:logEntry',`stderr: ${err}`,true);
			reject()
		}
	})
}*/

function uncookRun(toggle,params,stepbar,logger){
	return new Promise((resolve,reject) =>{
		var oldmsg = '';
		if (toggle){
			let uncooker = preferences.get('paths.wcli')
			subproc = spawner(uncooker,params).on('error',function(err){
				mainWindow.webContents.send('preload:uncookErr',err)
			})

			let oldtxt = ''
			subproc.stdout.on('data', (data) => {

				if (!(/%/.test(data.toString()))){
					//don't clog the logger with duplicates
					if (oldmsg!=data.toString()){
						mainWindow.webContents.send('preload:uncookErr',`${data}`,logger)
					}
				}else{
					if (oldtxt != data.toString().split("%")[0]){
						oldtxt = data.toString().split("%")[0]

						if (oldtxt.length>4){
							mainWindow.webContents.send('preload:uncookErr',`${data}`,logger)
						}else{
							if (stepbar){
								mainWindow.webContents.send('preload:uncookBar',oldtxt,stepbar)
							}
						}
					}
				}

			});

			subproc.stderr.on('data', (data) => {
				mainWindow.webContents.send('preload:logEntry',`stderr: ${data}`,true)
				mainWindow.webContents.send('preload:uncookErr',`${data}`,logger)
			});

			subproc.on('close', (code,signal) => {
				if (code == 0){
					//No Error
					switch (stepbar) {
						case 'step1':
						case 'step3':
						case 'step5':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Mesh with materials done</span>')
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
						case 'step10':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Fonts exported</span>')
							break;
						case 'step11':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty chars exported</span>')
							break;
						case 'step12':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty weapons exported</span>')
							break;
						case 'step13':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty vehicles exported</span>')
							break;
						case 'step14':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty mechanical exported</span>')
							break;
						case 'step15':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty environment exported</span>')
							break;
						case 'micro_opt01':
						case 'micro_opt02':
						case 'micro_opt03':
							mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Microblends step done</span>','#microLogger div')
							break;
					}
					if (stepbar){
						mainWindow.webContents.send('preload:uncookBar','100',stepbar)
					}
					resolve()
				}else{
					mainWindow.webContents.send('preload:uncookErr',`child process exited with code ${code}`)
					reject()
				}
			})

		}else{
			resolve()
		}
	})
}

ipcMain.on('main:stopTheuncook',(event)=>{
	subproc.kill('SIGTERM');
	mainWindow.webContents.send('preload:enable',"#triggerUncook")
	mainWindow.webContents.send('preload:disable',"#stopUncook")
})

ipcMain.on('main:uncookForRepo',(event,conf)=> {
	fs.access(path.normalize(preferences.get('paths.depot')),fs.constants.W_OK,(err)=>{
		if (err){
			// The folder isn't accessible for writing
			dialog.showErrorBox("It seems that you can't write in your unbundle folder. Try to check your permissions for that folder ",err.message)
		}else{
			var gameContentPath = preferences.get('paths.game');
			if (gameContentPath!=''){
				//try to use the path for the content you setup in the preferences
				mainWindow.webContents.send('preload:logEntry',`using the preference path for the game archive\\pc\\content folder
				in ${gameContentPath}`)
				mainWindow.webContents.send('preload:logEntry',`The export will be done into ${preferences.get('paths.depot')}`)
				var archiveFilter = repoBuilder(gameContentPath,conf)
			}else{
				var archivefold = dialog.showOpenDialog({title:'Select the game folder (Cyberpunk 2077)',properties: ['openDirectory'],defaultPath:app.getPath('desktop')})
				.then(selection => {
					if (!selection.canceled){
						repoBuilder(selection.filePaths[0],conf)
					}
				}).catch(err => mainWindow.webContents.send('preload:logEntry',`${err} `, true))
			}
		}
	})
})

//function to execute the series of uncook
function repoBuilder(contentdir, conf){

	vanillaContentPath = path.join(contentdir,spotfolder.base)
	phantomLContentPath = path.join(contentdir,spotfolder.pl)

	return new Promise((resolve,reject) =>{
		let unbundlefoWkit = preferences.get('paths.depot')
		let uncooker = preferences.get('paths.wcli')
		
		if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
			if (typeof(conf)=='object'){
				mainWindow.webContents.send('preload:uncookLogClean')
				var exportFormatGE = preferences.get('maskformat')
				uncookRun(conf[0],["uncook", "-p", path.join(vanillaContentPath,archives.nightcity), "-r","^base.(vehicles|weapons|characters|mechanical).+(?!proxy).+\.(mesh|mlmask)$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE, "-o",unbundlefoWkit],'step1')
					.then(()=>{mainWindow.webContents.send('preload:stepok',"#arc_NC3")})
					.then(()=>uncookRun(conf[1],["uncook", "-p", path.join(vanillaContentPath,archives.appearances), "-r","^base.(vehicles|weapons|characters|mechanical).+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE,"-o",unbundlefoWkit],'step3'))
					.then(()=>{mainWindow.webContents.send('preload:stepok',"#arc_AP4")})
					.then(()=>uncookRun(conf[2],["uncook", "-p", path.join(vanillaContentPath,archives.gamedata), "-r","^base.(vehicles|weapons|characters|mechanical).+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE,"-o",unbundlefoWkit],'step5'))
					.then(()=>{mainWindow.webContents.send('preload:stepok',"#arc_GA4")})
					.then(()=>uncookRun(conf[3],["uncook", "-p", path.join(vanillaContentPath,archives.gamedata), "-r","^base.gameplay.gui.fonts.+\.fnt$","-o",unbundlefoWkit,"-or",unbundlefoWkit],'step9'))
					.then(()=>{ mainWindow.webContents.send('preload:stepok',"#arc_FNT4")})
					//.then(()=>{checkMakeSymlinks()})
					.then(()=>uncookRun(conf[4],["uncook", "-p", phantomLContentPath, "-r","^ep1.characters.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE,"-o",unbundlefoWkit,"-or",unbundlefoWkit, "-gp", contentdir],'step10'))
					.then(()=>{ mainWindow.webContents.send('preload:stepok',"#ep1_CH")})
					.then(()=>uncookRun(conf[5],["uncook", "-p", phantomLContentPath, "-r","^ep1.weapons.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE,"-o",unbundlefoWkit,"-or",unbundlefoWkit,"-gp", contentdir],'step11'))
					.then(()=>{ mainWindow.webContents.send('preload:stepok',"#ep1_WE")})
					.then(()=>uncookRun(conf[6],["uncook", "-p", phantomLContentPath, "-r","^ep1.vehicles.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE,"-o",unbundlefoWkit,"-or",unbundlefoWkit,"-gp", contentdir],'step12'))
					.then(()=>{ mainWindow.webContents.send('preload:stepok',"#ep1_VE")})
					.then(()=>uncookRun(conf[7],["uncook", "-p", phantomLContentPath, "-r","^ep1.mechanical.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE,"-o",unbundlefoWkit,"-or",unbundlefoWkit,"-gp", contentdir],'step13'))
					.then(()=>{ mainWindow.webContents.send('preload:stepok',"#ME")})
					.then(()=>uncookRun(conf[7],["uncook", "-p", phantomLContentPath, "-r","^ep1.environment.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", exportFormatGE,"-o",unbundlefoWkit,"-or",unbundlefoWkit,"-gp", contentdir],'step14'))
					.then(()=>{ mainWindow.webContents.send('preload:stepok',"#ep1_EN")})
					.catch(err => { console.log(err) })
					.finally(() => {
						mainWindow.webContents.send('preload:enable',"#triggerUncook")
						mainWindow.webContents.send('preload:disable',"#stopUncook")
					})
				}
		}
	})
}

ipcMain.on('main:setMicroCoords',(event,datas)=>{
	aimWindow.close()
	mainWindow.webContents.send('preload:setMicroCoords',datas)
})

ipcMain.on('main:uncookMicroblends',(event)=>{
	fs.access(path.normalize(preferences.get('paths.depot')),fs.constants.W_OK,(err)=>{
		if (err){
			// The folder isn't accessible for writing
			dialog.showErrorBox("It seems that you can't write in your unbundle folder. Try to check your permissions for that folder ",err.message)
		}else{

			var gameContentPath = preferences.get('paths.game')
			if (gameContentPath!=''){
				//try to use the path for the content you setup in the preferences
				mainWindow.webContents.send('preload:logEntry',`using the preference path for the game archive\\pc\\content folder
				in ${gameContentPath}`)
				var archiveFilter = microBuilder(gameContentPath)
			}else{
				let archive = dialog.showOpenDialog({title:'Select the game folder with the default archives (found in Cyberpunk 2077\\archive\\pc\\content)',properties: ['openDirectory'],defaultPath:app.getPath('desktop')})
				.then(selection => {
					if (!selection.canceled){
						var archiveFilter = microBuilder(selection.filePaths[0])
					}
				})
				.catch((err)=> mainWindow.webContents.send('preload:logEntry',`${err} `,true))
			}
		}
	})
})

function microBuilder(contentdir){
	contentpath = path.join(contentdir,spotfolder.base)
	return new Promise((resolve,reject) =>{

			let unbundlefoWkit = preferences.get('paths.depot') //String(preferences.get('unbundle')).replace(/base$/,'')
			let uncooker = preferences.get('paths.wcli')
			var countingOnYou = 0

			if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
				mainWindow.webContents.send('preload:uncookLogClean','#microLogger div')

				uncookRun(true,["uncook", "-p", path.join(contentpath,archives.engine), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt01','#microLogger div')
					.then(()=> 	uncookRun(true,["uncook", "-p", path.join(contentpath,archives.nightcity), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt02','#microLogger div'))
					.then(()=> 	uncookRun(true,["uncook", "-p", path.join(contentpath,archives.gamedata), "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],'micro_opt03','#microLogger div'))
					.then(()=> {
						return new Promise((resolve,reject) =>{
							fs.readdir(path.join(String(preferences.get('paths.depot')),'base/surfaces/microblends/'),(err,files)=>{
								if (err){
										mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger div')
										reject()
								}else {
									var slavefiles = []
									files.forEach((el)=>{
										if (el.match(/.+\.png$/))
										slavefiles.push(el)
									})
									mainWindow.webContents.send('preload:uncookErr','Found '+slavefiles.length+' microblends to process','#microLogger div')
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

								sharp(path.join(String(preferences.get('paths.depot')),'base/surfaces/microblends/',png))
									.resize(256)
									.toFile(path.join(app.getAppPath(),'images/',png), (err, info) => {
										 if(err){
											 mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger div')
										 }else{
											 mainWindow.webContents.send('preload:uncookBar',String(Math.round(Number(perc * k))),'mresize')
										 }
										})
										.resize(64)
										.toFile(path.join(app.getAppPath(),'images/thumbs/',png), (err, info) => {
											 if(err){
												 mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger div')
											 }else{
												 mainWindow.webContents.send('preload:uncookBar',String(Math.round(Number(perc * k))),'mthumbs')
											 }
											})
								k++
							})
						}catch(err){
							mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger div');
						}
					})
					.catch((err)=>{mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger div')})
					.finally(() => {
						mainWindow.webContents.send('preload:enable',"#MycroMe");
						mainWindow.webContents.send('preload:trigEvent',{target:"body", trigger:'updateMBlends'});
					})
			}
	})
}

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
			JsonResourceRead(userRfiles.microblends)
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
		JsonResourceRead(userRfiles.microblends)
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

/*
Scan a folder to search for certain types of files
*/
ipcMain.on('main:scanFolder',()=>{
	var archive = dialog.showOpenDialog({title:'Select a folder you want to scan',properties: ['openDirectory'],defaultPath:app.getPath('recent')})
		.then(selection => {
			if (!selection.canceled){
				if (selection.filePaths[0] == preferences.get('paths.depot')){
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


