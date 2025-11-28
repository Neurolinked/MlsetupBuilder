// main.js
// Modules to control application life and create native browser window
import {app, BrowserWindow, globalShortcut, screen, Notification, ipcMain, nativeTheme, dialog, Menu} from 'electron';
import {shell as outside} from 'electron';
import {execFile as child} from 'child_process'; //check the subroutines for execFile and spawn
import {spawn as spawner} from 'child_process';
import log from 'electron-log';
import path from 'node:path';
import * as fs from 'node:fs';
import fse from 'fs-extra/esm';
import Store from 'electron-store';
import sharp from 'sharp';
import * as dree from 'dree';
import { fileURLToPath } from 'url';
/* import { arrayBuffer } from 'node:stream/consumers'; */

const compatibleVersion = 2.3;
const crypto = await import('node:crypto');

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.commandLine.appendSwitch('enable-gpu') //enable acceleration
app.commandLine.appendSwitch('disable-features', 'UiGpuRasterization') //Fix white border on window

const hash = crypto.createHash('sha256');

//Log setups
log.transports.file.level = 'info' 
log.transports.console.level = 'info'
//model log file

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
			},
			skipImport:true,
			switchTransparency:true,
			sortLevels:false
		}
	}
};
var itMigrate = false;

const wolvenkitPrefFile = path.join(app.getPath('appData'),'REDModding/WolvenKit/config.json');

const preferences = new Store({schema,
	beforeEachMigration: (store, context) => {
		//migration incoming
		log.info(`[main-config] migrate from ${context.fromVersion} → ${context.toVersion}`)

		if (!store.has("editorCfg")){
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
					},
					skipImport:false,
					switchTransparency:true,
					sortLevels:false
				}
			});
		}
		if (!store.has("editorCfg.sortLevels")){
			store.set('editorCfg.sortLevels',false);
		}
		if (!store.has("editorCfg.switchTransparency")){
			store.set('editorCfg.switchTransparency',true);
		}
		if (!store.has("editorCfg.skipImport")){
			store.set('editorCfg.skipImport',false);
		}
		if (store.has("pathfix")){
			store.delete('pathfix')
		}
		if (store.has("depot")){
			console.log("deteled Depot");
			store.delete("depot");
		}
		if (store.has("game")){
			store.delete("game")
		}
		if (store.has("unbundle")){
			store.delete("unbundle")
		}
		if (store.has("wcli")){
			store.delete("wcli")
		}
		itMigrate = true;
	},
	migrations: {
		'<=1.6.2': store => {
			if (store.has('unbundle') && (!store.has('pathfix'))){
				let fixstring = store.get('unbundle')
				store.set('unbundle',fixstring.replace(/\\base$/,''))
				store.set('pathfix','1')
			}else{
				store.set('unbundle','');
				store.set('pathfix','0');
			}
		},
		'1.6.3': store =>{
			if (store.has("pathfix")){
				store.delete('pathfix')
			}
			store.set('legacymaterial',false)
		},
		'1.6.6': store =>{
			store.set('game','')
			store.set('depot','')
		},
		'1.6.7': store =>{
			if (store.get('depot')==''){
				//preparing for the switch from the unbundle folder, to the depot one
				if (store.has("unbundle")){
					let fixVal = store.get('unbundle')
					store.set('depot', fixVal)
				}
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
			var fixGamePath = store.get('paths.game');
			store.set({
				paths:{
						depot: store.get('paths.depot'),
						game:fixGamePath,
						lastmod: '',
						wcli: store.get('paths.wcli')
					}
				})
			
		},
		'1.6.8-beta8': store=>{
			store.set('editorCfg.skipImport',false);
		},
		'1.6.8-rc1': store=>{
			store.set('editorCfg.switchTransparency',true);
		},
		'1.6.8-rc4': store=>{
			store.set('editorCfg.sortLevels',false);
		},
		'1.6.9': store=>{
			store.set('editorCfg.skipImport',true);
		}
	}
});

preferences.watch = true
var mainWindow, aimWindow, McomposerWindow; //check variable name

var mljson = app.commandLine.getSwitchValue("open")
if (mljson ==''){
  mljson = app.commandLine.getSwitchValue("o")
}

var wkitto = app.commandLine.getSwitchValue("wkit")
var dev = app.commandLine.getSwitchValue("dev")

var lastMicroConf = {}

//register the application name
if (process.platform === 'win32'){ app.setAppUserModelId(app.name); }

/**
 * 
 * @param {string} message 
 * @param {string} title 
 * @param {integer} seconds 
 */
function alert(message,title="Warning",seconds=null){
	mainWindow.webContents.send('preload:trigEvent',
		{
			target:"body",
			trigger:'alert',
			options:{
				message:message,
				title:title,
				seconds:seconds
			}
		}
	);
}

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

//simple promise to read files
function fileOpener(target=''){
	return new Promise((resolve,reject)=>{
		fs.readFile(target,(err,filecontent) =>{
			if (err) {
				mainWindow.webContents.send('preload:logEntry',`Error when trying to read ${target} file`,true);
				reject(err)
			}else{
				mainWindow.webContents.send('preload:logEntry',`File ${target} opened`,false);
				resolve(filecontent)
			}
		})
	})
}

function fileWriter(target,content='',encode='utf8'){
	return new Promise((resolve,reject) =>{
		 fs.writeFile(target, content, encode,(err) => {
  			if (err) {
				reject(err)
				throw err
			}else{
				resolve()
			}
		})
	})
}

async function fqfnFile(event,arg){
	//fully qualified file name resource pointer
	if ((arg.hasOwnProperty('extension') ) && (arg.hasOwnProperty('path'))){
		let seenPath = path.dirname(arg.path);
		
		const {canceled,filePaths } = await dialog.showOpenDialog({title:`Select the .${arg.extension} file`, properties: ['openFile'], defaultPath:path.join(preferences.get('paths.depot'),seenPath ), filters: [
			{ name: 'specific type', extensions: [arg.extension] }] });
		if (canceled){
			return false
		}else{
			return filePaths[0]
		}
	}else{
		return
	}
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
	});
	modal.menuBarVisible=false
	modal.minimizable=false
	modal.loadFile(htmlFile)
	modal.once('ready-to-show', () => {
		modal.show()
	})
	modal.once('close', ()=>{
		modal.hide();
	});
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
					{label: 'Import', accelerator:'Ctrl+i', click: async () =>{
						let depot = preferences.get('paths.depot')
						var importPr = await fqfnFile(false,{extension:"json",path:depot})
						if (importPr){
							fs.stat(importPr,'utf8',function(err, stat) {
								if (err) {
								  if (err.code=='ENOENT'){
									dialog.showErrorBox("File opening error","The searched file does not exists")
								  }else{
									dialog.showErrorBox("File opening error",err.message)
								  }
								  return
								}else{
								  var mlsetup_content = ""
								  fs.readFile(importPr,'utf8',(err,data) =>{
									try {
										mlsetup_content = JSON.parse(data)
									} catch(e) {
									   dialog.showErrorBox("File error","Reading error: wrong json file format")
									}
									mainWindow.webContents.send('preload:load_source',mlsetup_content, importPr);
								  })
								}
							  })
						}else{
							mainWindow.webContents.send('preload:logEntry','Loading cancelled',false)
						}
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
		{id:99, label: 'Build',
			submenu:[
				{ label:'Repository', click: () =>{ mainWindow.webContents.send('preload:openModal','uncook')} },
				{ label:'Microblends', click: () =>{ mainWindow.webContents.send('preload:openModal','micro')} },
				{ label:"Model's Database", click: () => { genModelListDB(); } }
			]
		}
		] : [
		{id:99, label: 'Build', submenu:[{label:'Setup first Wolvenkit CLI', enabled:false}] }
	]),
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
			{label: 'Material Composer',accelerator: 'Ctrl+K',click:()=>{
				McomposerWindow = childWindow("apps/materials.html",mainWindow,1200,800,'Material Composer', {preload: path.join(__dirname, 'apps/preloadmats.js')} );
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
				mainWindow.webContents.downloadURL(`https://github.com/WolvenKit/WolvenKit/releases/download/8.14.0/WolvenKit.Console-8.14.0.zip`);
			}
		},
		{
			label:'Github Repository',
			click:()=>{
				outside.openExternal("https://github.com/Neurolinked/MlsetupBuilder");
			}
		},
		{ type: 'separator' },
		{
			label:'Donations',
			click:()=>{
				outside.openExternal("https://ko-fi.com/neurolinked99888");
			}
		},
		{ type: 'separator' },
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
	  additionalArguments: [`--nonce=${hash.digest('base64')}`],
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

  const dotNetCorePath = `C:\\Program Files\\dotnet\\shared\\Microsoft.NETCore.App`;
  fs.access(dotNetCorePath,fs.constants.R_OK,(error)=>{
	if (error){
		setTimeout(()=>{
			mainWindow.webContents.send('preload:logEntry', "Yo Choom upgrade your Chrome!, you don't have .Net Core Framework 8.x.x on you. You cheap newbie !! to hit The Streets you need to Chippin' In!",true);
		},3000);
	}else{
		//Some .Net is installed
		try {
			let matchDotNet = false;
			const files = fs.readdir(dotNetCorePath, { withFileTypes: true },(err,files)=>{
				if (err){
					setTimeout(()=>{
						mainWindow.webContents.send('preload:logEntry', error,true);
					},3000);
				}
				for (const file of files){
					if ((file.name.match(/^8\.+/)) && file.isDirectory() ){
						matchDotNet = true;
					}
				}
				if (!matchDotNet){
					setTimeout(()=>{
						mainWindow.webContents.send('preload:logEntry', "Choom you have some Chrome but not the right retroWare for the Job, you need .Net Core Framework 8.x.x to unCook datas. Got and get it!",true);
					},3000);
				}
			});
		} catch (error) {
			console.log(error);
		}
	}
  });
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

function registerShortcuts(){
	/* globalShortcut.register("CommandOrControl+W", () => {
	//stuff here
	}); */
	
	globalShortcut.register("Shift+CommandOrControl+A",() => {
		mainWindow.webContents.send('preload:activate', '#applytoMyLayer')
	})
}
//Registering commands
app.focus(()=>{ registerShortcuts() })

app.on('browser-window-focus', () => {
	registerShortcuts();
})
app.on('browser-window-blur', () => {
	globalShortcut.unregisterAll()
})

/**
 * @param {string} target DOM queryselector value
 * @param {boolean} value value for the checkbox
 */
function switchUICheckbox(target,value){
	mainWindow.webContents.send('preload:UImanager',{
		command:"checked",
		target:target,
		content:value
	})
}

ipcMain.on('main:aimMicros',(event,configurations) =>{
	lastMicroConf = configurations
	aimWindow = createModal("apps/aiming.html",mainWindow,1380,802,'Microblends aiming', {preload: path.join(__dirname, 'apps/preloadaim.js')});
})

ipcMain.on('main:reloadAim',()=>{
	aimWindow.webContents.send('preload:configure',lastMicroConf)
});

/** Send Material file content */
ipcMain.handle('main:composerMaterial',async(ev,filepath)=>{
	try {
		const content = await AfileRead(filepath,'utf8',false);
		//console.log(content);
		McomposerWindow = childWindow("apps/materials.html",mainWindow,1200,800,'Material Composer', {preload: path.join(__dirname, 'apps/preloadmats.js')} );
		setTimeout(()=>{
			McomposerWindow.webContents.send('preload:openMaterial',content);
		},1000);
	} catch (error) {
		mainWindow.webContents.send('preload:logEntry', `Impossible to read ${filepath} : ${error}`,true)
	}
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


async function AfileRead(userpath,flags,noRepo){
	return new Promise((resolve, reject) => {
		var modPath = preferences.get('paths.lastmod')
		var hasDepot
		if ((modPath!==undefined) && (modPath!='')){
			var hasDepot = preferences.get('paths.lastmod')!=preferences.get('paths.depot') ? true : false
		}else{
			hasDepot = false;
		}
		var whereLoadFrom

		if (/^[\w|\W]:\\.+/.test(userpath) || noRepo){
			//custom loading
			whereLoadFrom = path.normalize(userpath)
		}else{
			if (preferences.get('paths.depot')==''){
				log.warn(`The Depot preference isn't configured`)
				mainWindow.webContents.send('preload:logEntry', `No Depot setup, go to Preferences window and fix it`);
				reject('No Depot');
			}
			whereLoadFrom = path.join(preferences.get('paths.depot'),userpath)
		}

		fs.readFile(whereLoadFrom,flags,(err,contentfile) =>{
			if (err) {
				if (err.code=='ENOENT'){
					if (hasDepot){
						mainWindow.webContents.send('preload:logEntry', `Missing file - ${whereLoadFrom}`,true);
						mainWindow.webContents.send('preload:logEntry',`Trying in the last Mod Folder`);

						fs.readFile(whereLoadFrom,flags,(err,contenutofile) =>{
							if (err){
								if (err.code=='ENOENT'){
									if (whereLoadFrom){
										mainWindow.webContents.send('preload:logEntry', `File not found in: ${whereLoadFrom}`,true)
									}else{
										mainWindow.webContents.send('preload:logEntry', `The searched file does not exists also in the Mod Path ${whereLoadFrom}`,true)
									}
								}
								
								if (whereLoadFrom.match(new RegExp(/.+\.glb$/))){
									mainWindow.webContents.send('preload:request_uncook')
								}
								reject(err);
							}else{
								mainWindow.webContents.send('preload:logEntry', 'File found in the Last Mod Folder, Yay!')
								resolve(contenutofile)
							}
						})

					}else{
						//Extract the needed files
						if (whereLoadFrom.match(new RegExp(/.+\.glb$/)) || whereLoadFrom.match(new RegExp(/.+\.Material\.json$/)) ){
							mainWindow.webContents.send('preload:request_uncook')
						}
						reject(err);
					}
				}
				mainWindow.webContents.send('preload:logEntry', `File ${whereLoadFrom} opening error ${err.message}`)
				reject(err);
			}
			mainWindow.webContents.send('preload:logEntry', `File loaded: ${whereLoadFrom}`);
			resolve(contentfile);
		})
	})
}

ipcMain.handle('main:fileReading',async(event,path,flags,noRepo)=>{
	const result = await AfileRead(path,flags,noRepo);
	return result;
});

//read file on disk
ipcMain.on('main:asyncReadFile',(event,percorso,flags,no_repo)=>{
	var modPath = preferences.get('paths.lastmod')
	var hasDepot
	if ((modPath!==undefined) && (modPath!='')){
		var hasDepot = preferences.get('paths.lastmod')!=preferences.get('paths.depot') ? true : false
	}else{
		hasDepot = false;
	}
	
	var whereLoadFrom

	if (/^[\w|\W]:\\.+/.test(percorso) || no_repo){
		//custom loading
		whereLoadFrom = path.normalize(percorso)
	}else{
		if (preferences.get('paths.depot')==''){
			log.warn(`The Depot preference isn't configured`)
			event.reply('preload:logEntry', `No Depot setup, go to Preferences window and fix it`);
			event.returnValue = '';
			return
		}
		whereLoadFrom = path.join(preferences.get('paths.depot'),percorso)
	}

	var a3dMatModel = whereLoadFrom.search(/^.+\.glb$/g)>-1 ? whereLoadFrom: ``; //path of the hypotethical material file
	
  	fs.readFile(whereLoadFrom,flags,(err,contenutofile) =>{
    	if (err) {
      		if (err.code=='ENOENT'){
				if (hasDepot){

					event.reply('preload:logEntry', `Missing file - ${whereLoadFrom}`,true);
					event.reply('preload:logEntry',`Trying in the last Mod Folder`);

					whereLoadFrom = path.join(preferences.get('paths.lastmod'),percorso)

					fs.readFile(whereLoadFrom,flags,(err,contenutofile) =>{
						if (err){
							if (err.code=='ENOENT'){
								if (whereLoadFrom){
									event.reply('preload:logEntry', `File not found in: ${whereLoadFrom}`,true)
								}else{
									//dialog.showErrorBox("File opening error",`The searched file does not exists also in the Depot ${whereLoadFrom}`)
									event.reply('preload:logEntry', `Missing file - ${whereLoadFrom}`,true)
								}
							}
							contenutofile=""
							a3dMatModel="";
							/* if (whereLoadFrom.match(new RegExp(/.+\.glb$/))){
								mainWindow.webContents.send('preload:request_uncook');
							} */
							mainWindow.webContents.send('preload:dialog',{message:"File not found, do you want to try uncook the file now ?",action:'uncook'})
						}else{
							event.reply('preload:logEntry', 'File found in the Last Mod Folder, Yay!')
						}
					})
				}else{
					if (normals.test(whereLoadFrom)){
						event.reply('preload:logEntry', 'File not found in : '+whereLoadFrom,true)
					}else{
						a3dMatModel="";

						if (whereLoadFrom.match(new RegExp(/.+\.glb$/))){
							//dialog.showErrorBox("File opening error","The searched file does not exists \n"+whereLoadFrom)
							//dialog.showErrorBox("Meow","The searched file does not exists \n"+whereLoadFrom)
						}
						
						event.reply('preload:logEntry', 'Missing file - '+whereLoadFrom,true)
					}
					contenutofile = ""
					if (whereLoadFrom.match(new RegExp(/.+\.glb$/)) || whereLoadFrom.match(new RegExp(/.+\.Material\.json$/)) ){
						mainWindow.webContents.send('preload:dialog',
							{
								message:"File not found, do you want to try uncook the file now ?",
								action:'uncook'
							})
					}else if (whereLoadFrom.match( new RegExp(/.+masksset.+$/) ) ){
						event.reply('preload:logEntry', 'Missing file - '+whereLoadFrom,true)
					}
				}
			}else{
				event.reply('preload:logEntry', `File opening error ${err.message}`)
				a3dMatModel="";
			}
			contenutofile=""
		}else{
			event.reply('preload:logEntry', `File loaded: ${whereLoadFrom}`)
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
		}else if (/^\d+\.\d+\.\d+$/.test(wkitto)){
			 objwkitto={
				full:wkitto,
				major:Number(wkitto.split('.')[0]),
				minor:Number(wkitto.split('.')[1]),
				patches:Number(wkitto.split('.')[2])
			}
		}else if (/^\d+\.\d+-rc\d+$/.test(wkitto)){
			 objwkitto={
				full:wkitto,
				major:Number(wkitto.split('.')[0]),
				minor:Number(wkitto.split('.')[1].split('-')[0]),
				patches:0
			}
		}else{
			objwkitto={
				full:0,
				major:0,
				minor:0,
				patches:0
			}
		}
		event.reply('preload:logEntry', 'MlsetupBuilder is working as Wolvenkit plugin')
		event.reply('preload:wkitBuild',JSON.stringify(objwkitto))
	}
})

//setup the version of the software where needed
ipcMain.on('main:getversion',(event, arg) =>{
	event.reply('preload:setversion',{version:app.getVersion(),changed:itMigrate})
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
						preferences.set(`paths.depot`,WolvenkitConfig.MaterialRepositoryPath);
					}
					if ((WolvenkitConfig.hasOwnProperty('CP77ExecutablePath')) && (preferences.get(`paths.game`)=='')) {
						preferences.set(`paths.game`,WolvenkitConfig.CP77ExecutablePath.replace("\\bin\\x64\\Cyberpunk2077.exe",""))
					}
				} catch (error) {
					event.reply('preload:logEntry',`The file is there, but i got an error:${error}`,false);
				}
			}
		})
	}
})

ipcMain.handle('main:fileCatch',fqfnFile)
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
		  filters:[ { name: 'Multilayer Mask List', extensions: ['mlmask'] }],
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

ipcMain.on('main:osOpen',(event,arg)=>{
	outside.openPath(arg)
		.then((result)=>{
			if (result==""){
				event.reply('preload:logEntry', 'File Opened by the system')
			}else{
				event.reply('preload:logEntry', result)
			}
		}).catch((error)=>event.reply('preload:logEntry', error))
});

/* ipcMain.on('main:3dialog',(event, arg) => {
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
  
}) */

//Save the preferences
ipcMain.on('main:saveStore',(event, arg) => {
	if (arg.hasOwnProperty('editorCfg')){
		//MMMMMMM to be reworked
		preferences.set('editorCfg.layer.tiles.value',arg.editorCfg.layer.tiles.value);
		preferences.set('editorCfg.mblend.tiles.value',arg.editorCfg.mblend.tiles.value);
		preferences.set('editorCfg.mblend.contrast.value',arg.editorCfg.mblend.contrast.value);
		preferences.set('editorCfg.mblend.normal.value',arg.editorCfg.mblend.normal.value);
		preferences.set('editorCfg.skipImport',arg.editorCfg.skipImport);
		preferences.set('editorCfg.switchTransparency',arg.editorCfg.switchTransparency);
		preferences.set('editorCfg.sortLevels',arg.editorCfg.sortLevels);
	}else{
		/*
		Get the object property and cycle them, test if they are there
		then they are been setup
		*/
		var Arguments = Object.keys(arg);
		Arguments.forEach((setting)=>{
			if (preferences.has(setting)){
				preferences.set(setting, arg[setting]);
				if (setting == 'maskformat'){
					mainWindow.webContents.send('preload:trigEvent',{target:"#thacanvas", trigger:'changeFormat'})
				}
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
				while (salvataggio.filePath.includes(".mlsetup.mlsetup")) {
					salvataggio.filePath = salvataggio.filePath.replace(".mlsetup.mlsetup",".mlsetup")
				}
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
		const customListPath = path.join(app.getPath('userData'),arg.file)
		const customListWrite = fileWriter(customListPath,arg.content)
		customListWrite.then((ev)=>{
			event.reply('preload:logEntry', 'models list saved')
		}).catch((err)=>{
			event.reply('preload:logEntry', `Save procedure aborted ${err}`,true)
		})
		/* fs.writeFile(customListPath, arg.content,'utf8',(errw, data) =>{
			if(errw){
				event.reply('preload:logEntry', 'Save procedure aborted',true)
				dialog.showErrorBox('Error during the writing process of the file')
				return
			}else{
				new Notification({title:"Save List", body: "Your file has been saved" }).show()
				event.reply('preload:logEntry', 'models list saved')
			}
		}) */
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
					//Trying to export
					wcliExecuter(["uncook", "-gp", contentpath, "-w", path.normalize(conf),"--mesh-export-type", "MeshOnly", "--uext", exportFormatGE, "-o",unbundlefoWkit],
					{
						log:true,
						logTarget:"UI",
						logger:'#NotificationCenter .offcanvas-body'
					})
					.then(()=>{
						event.reply('preload:logEntry',"Export of the model Done, reload");
					}).catch(err => { console.log(err) })
					.finally(()=>{
						mainWindow.webContents.send('preload:noBar','');
						mainWindow.webContents.send('preload:activate','#btnMdlLoader');

					});
				}else{
					event.reply('preload:logEntry',`Wolvenkit.CLI isn't selected in the settings`,true)
				}
			}

		}
	})
})

//fill an array with operations to be done in the cli execution
/**
 * 
 * @param {string} sourceSwitch 
 */
function wcliPlanner(sourceSwitch,conf){
	var params = []
	var options = {
		log:true,
		logTarget:"UI",
		logger:"#uncookLogger div",
		toggle:`#${sourceSwitch}`,
	}
	switch (sourceSwitch){
		case 'arc_NC3':
			options.bar='step1';
			params = ["uncook", "-gp", conf.content, "-r","^base.characters.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat, "-o",conf.depot]
			break;
		case 'arc_AP4':
			options.bar='step3';
			params = ["uncook", "-gp", conf.content, "-r","^base.weapons.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot]
			break;
		case 'arc_GA4':
			options.bar='step5';
			params = ["uncook", "-gp", conf.content, "-r","^base.(vehicles|mechanical).+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot]
			break;
		case 'arc_EN':
			options.bar='step9';
			params = ["uncook", "-gp", conf.content, "-r","^base.environment.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot];
			break;
		case 'ep1_CH':
			options.bar = 'step10'
			params=["uncook", "-gp", conf.content, "-r","^ep1.characters.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot]
			break;
		case 'ep1_WE':
			options.bar = 'step11'
			params = ["uncook", "-gp", conf.content, "-r","^ep1.weapons.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot]
			break;
		case 'ep1_VE':
			options.bar = 'step12'
			params = ["uncook", "-gp", conf.content, "-r","^ep1.vehicles.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot]
			break;
		case 'ep1_ME':
			options.bar = 'step13'
			params = ["uncook", "-gp", conf.content,"-r","^ep1.mechanical.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot,"-or",conf.depot]
			break;
		case 'ep1_EN':
			options.bar = 'step14'
			params = ["uncook", "-gp", conf.content,"-r","^ep1.environment.+(?!proxy).+\.mesh$","--mesh-export-type", "MeshOnly", "--uext", conf.maskformat,"-o",conf.depot]
			break;
		case 'base_MT':
			options.bar = 'step16'
			params = ["uncook", "-gp", conf.content, "-r","^base.surfaces.materials.+\.xbm$", "--uext", conf.maskformat,"-o",conf.depot]
			break;
		
	}
	return wcliExecuter(params,options)
}

/**
 * 
 * @param {string} barIdentifier - identifier for a UI progressbar
 */
function manageProgressbars(barIdentifier){
	switch (barIdentifier) {
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
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Base Environments models exported</span>')
			break;
		case 'step10':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty chars exported</span>')
			break;
		case 'step11':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty weapons exported</span>')
			break;
		case 'step12':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty vehicles exported</span>')
			break;
		case 'step13':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty mechanical exported</span>')
			break;
		case 'step14':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty environment exported</span>')
			break;
			/* 				
		case 'step15':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Phantom Liberty environment exported</span>')
			break; */
		case 'step16':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Materials Textures exported</span>')
			break;
		case 'micro_opt01':
		case 'micro_opt02':
		case 'micro_opt03':
			mainWindow.webContents.send('preload:uncookErr','<span class="bg-success text-light">Microblends step done</span>','#microLogger div')
			break;
	}
}
/**
 * 
 * @param {array} params - list of the parameter to use for the execution
 * @param {Object[]} options - additional options to work with
 * @param {string} options.bar - bar to pass parameters to
 * @param {boolean} options.log - enable or disable log
 * @param {string} options.logTarget - UI or Disk value
 * @param {string} options.logger - where to redirect the log to
 * @param {string} options.toggle - toggle to eneble disable after command completion
 */
function wcliExecuter(params,options){
	//console.log(params);
	return new Promise((resolve,reject) =>{
		//variable initialization
		var deblog = '';
		var oldtext = ''; //debounce double entry logs
		var entireLog = '';
		const cliExecutable = preferences.get('paths.wcli');

		if (!options.hasOwnProperty("logTarget")) {
			//fix default behavious
			options.logTarget="UI";
		}else{
			if (options.logTarget!="DISK"){
				options.logTarget="UI";
			}
		}

		subproc = spawner(cliExecutable,params)
		.on('error',function(err){
			mainWindow.webContents.send('preload:logEntry',err);
		});
		//Output reading
		subproc.stdout.on('data', (data) => {
			var commandlog = data.toString();
			if (/%/.test(commandlog)){
				// there is a percentage
				if (oldtext != commandlog.split("%")[0]){
					//extract the percentage
					oldtext = commandlog.split("%")[0]
					if (oldtext.length>4){
						mainWindow.webContents.send('preload:uncookErr',`${commandlog}`,options.logger)
					}else{
						if (options.bar){
							mainWindow.webContents.send('preload:uncookBar',oldtext,options.bar)
						}
					}
				}
			}else{
				//straight text
				if (deblog!=commandlog){
					if (options?.log){
						if (options.logTarget=="UI"){
							if (options?.logger!='')
							mainWindow.webContents.send('preload:uncookErr',`${commandlog}`,options.logger)
						}else{
							//write to disk
						}
					}
					deblog = commandlog
					entireLog +=commandlog;
				}
			}
		});

		subproc.stderr.on('data', (data) => {
			mainWindow.webContents.send('preload:uncookErr',`stderr: ${data}`,options.logger)
		});

		subproc.on('close', (code,signal) => {
			if (code == 0){
				//No Error
				if (options?.stepbar){
					manageProgressbars(options.stepbar);
					//TODO change to fillbar since it's just a bar and not an uncook one
					mainWindow.webContents.send('preload:uncookBar','100',options.stepbar)
				}
				if (options?.toggle){
					switchUICheckbox(options.toggle,false);
				}
				resolve(entireLog);
			}else if ((code==160) && (params.includes("archive"))){
				resolve(entireLog);
			}else{
				mainWindow.webContents.send('preload:logEntry',`child process exited with code ${code}`,true)
				reject()
			}
		});
	});
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
				mainWindow.webContents.send('preload:logEntry',`using the preference path for the game folder
				in ${gameContentPath}`)
				mainWindow.webContents.send('preload:logEntry',`The export will be done into ${preferences.get('paths.depot')}`)
				var archiveFilter = repoBuilder(gameContentPath,conf)
				.then((result)=>{
					console.log(result);
				})
				.catch(err => mainWindow.webContents.send('preload:logEntry',`${err} `, true))
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
	return new Promise((resolve,reject) =>{
		let unbundlefoWkit = preferences.get('paths.depot')
		let uncooker = preferences.get('paths.wcli')
		
		if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
			if (typeof(conf)=='object'){

				mainWindow.webContents.send('preload:UImanager',{command:"reset",target:"#uncookLogger div"});
				var exportFormatGE = preferences.get('maskformat')
				
				const additionalRef = {
					content:contentdir,
					depot:unbundlefoWkit,
					maskformat:exportFormatGE
				};
				
				conf.reduce((previousPromise,nextID)=>{
					return previousPromise.then(()=>{
						return wcliPlanner(nextID,additionalRef)
					});
				},Promise.resolve())

				.catch(err=>mainWindow.webContents.send("preload:logEntry",`${err} `, true))
				.finally(()=>{
					mainWindow.webContents.send('preload:UImanager',{command:"enable",target:"#triggerUncook"})
					mainWindow.webContents.send('preload:UImanager',{command:"disable",target:"#stopUncook"})
				})
			}
		}
	})
}

function getModelTags(filename){
	const name = getModelName(filename);
	var tags = new Set();
	/** base or expansion */
	if (/^base/.test(filename)){tags.add("base")}
	if (/^ep1/.test(filename)){tags.add("PL")}
	/** gender match and body size */
	let genderMale = name.match("_p?m[ambcf]a?_")
	let genderFemale = name.match("_p?w[ambcf]a?_")
	if (genderMale!=null){
		tags.add("man")
		
		switch (genderMale[0]){
			case '_pma_': tags.add("player");
				break;
			case '_mc_': tags.add("child");
				break;
			case '_mba_':
			case '_mb_': tags.add("big");
				break;
			case '_mm_': tags.add("massive");
			break;
			case '_mf_': tags.add("fat");
		}
	}
	if (genderFemale!=null){
		tags.add("female")
		switch (genderFemale[0]){
			case '_pwa_': tags.add("player");
				break;
			case '_wc_': tags.add("child");
				break;
			case '_wba_':
			case '_wb_': tags.add("big");
				break;
			case '_wm_': tags.add("massive");
			break;
			case '_wf_': tags.add("fat");
		}
	}
	/** body parts */
	if (/^t\d_/.test(name)){
		tags.add("torso")
	}
	if (/^h\d_/.test(name)){
		tags.add("head")
	}
	if (/^l\d_/.test(name)){
		tags.add("legs")
	}
	if (/^s\d_/.test(name)){
		tags.add("feet")
	}
	if (/^a\d_/.test(name)){
		tags.add("arms")
	}
	if (/^g\d_/.test(name)){
		tags.add("hands")
	}
	if (/^hh_/.test(name)){
		tags.add("hairs")
	}
	if (/^i\d_/.test(name)){
		tags.add("item")
	}
	/** objects */
	if (/^q\d{3}_/.test(name)){
		tags.add("quest")
	}
	if (/^d\d_/.test(name)){
		tags.add("dismembered")
	}
	if (/^mch_/.test(name)){
		tags.add("mechanical")
	}
	if (/^w_/.test(name)){
		tags.add("weapon")
		if(filename.match("melee")!=null){
			tags.add("melee")
		}else if (filename.match("explosives")!=null){
			tags.add("explosives")
		}else{
			tags.add("firearms")
		}
	}
	/** Npcs */
	if(filename.match("main_npc")!=null){
		tags.add("npc")
		let npcname = /^\w+\\\w+\\\w+\\(\w+)/g
		let npc = [...filename.matchAll(npcname)]
		tags.add(npc[0][1])
	}

	if(filename.match("cyberware")!=null){tags.add("cyberware")}

	if(filename.match("environment")!=null){
		tags.add("environment")
		if (/^wat_kab_/.test(name)){
			tags.add("kabuki")
		}
	}
	// vehicles
	if(filename.match("vehicle")!=null){
		tags.add("vehicle")
		let category = name.match("^v_[a-z]+")
		if (category!=null){
			tags.add(category[0].slice(2))
		}
		if(filename.match("sportbike")!=null){
			tags.add("bike")
		}else if(filename.match("special")!=null){
			if (name.match("^av_")!=null){
			tags.add("av")
			}else{
			tags.add("special")
			}
		}else{
			tags.add("car")
		}
	}
	if(filename.match("garment")!=null){
		tags.add("cloth")
		if(filename.match("gang")!=null){
			tags.add("gang")
		}
	}

	return Array.from(tags) //Jsons doesn't convert-like Set objects
}
/**
 * 
 * @param {string} path 
 * @returns {string}
 */
function getModelName(path){
	var name = '';
	let tempPath = path.split("\\")
	let filename = tempPath.reverse()[0];
	if (/\.(\bmesh\b||\bglb\b)$/.test(filename)){
		name = filename.split(".")[0];
	}else{
		name = filename
	}
	return name;
}
/**
 * 
 * @param {string} text 
 * @returns {array} 
 */
function objDBuilder(text){
	const models = [];
	//read file as text every line
	const lines  = text.split("\r\n");

	for (var line = 0, completeText = lines.length; line < completeText; line++) {
		if (
			(lines[line]!='') &&
			(!(/^\[/.test(lines[line]))) &&
			(!((lines[line]).includes("proxy") || (lines[line]).includes("shadow")))
			){
			let model = {
				file: lines[line],
				name: getModelName(lines[line]),
				tags: getModelTags(lines[line])
			}
			models.push(model);
		}
    }
	return models;
}
/**
 * 
 * @param {string} text 
 * @returns {string}
 */
function bruteCleanupModelText(text){
	return text.replaceAll(/\.mesh/g,".glb") //change to 3d glb model
}
/**
 * 
 * @param {string} text 
 */
function buildModelDB(text){
	//DB Cleanup
	text = bruteCleanupModelText(text);
	const myBuildDB = {models:objDBuilder(text), version:compatibleVersion}
	return myBuildDB;
}

function genModelListDB(){
	const gameContent = preferences.get('paths.game');
	const depotFolder = preferences.get('paths.depot');
	fs.access(
		path.normalize(depotFolder),
		fs.constants.W_OK,
		(err)=>{
			if (err){
				/* The folder isn't accessible for writing
				then the list can't be build */
				alert("The Depot folder isn't accessible for writing","Error",3000);
			}else{
				//You can write in the Depot
				//If there is the CLI, execute the command for archive listing
				//saving the result in the depot
				/* const modeldbLog = log.create({ logId: 'modeldb' });
				modeldbLog.transports.file.resolvePathFn = () => path.join(preferences.get('paths.depot'), 'modeldb.log');
				modeldbLog.transports.file.format = '{text}'
				modeldbLog.transports.file.level = 'info'
				modeldbLog.transports.console.level = false; */
				var modelText = '';
				mainWindow.webContents.send('preload:trigEvent',{target:"body",trigger:'processBar'});
				//modeldbLog.info(`Miao`); logging text like this
			
				const archiveList = wcliExecuter(
					[
						"archive",
						"-l",
						"-r",
						"^\\b(ep1|base)\\b.\\b(characters|environment|items|vehicles|weapons)\\b.+(?!proxy).+\\.mesh$",
						"-p",
						path.normalize(path.join(gameContent,"archive\\pc\\content"))
					],{})
				.then((result)=>{
					if (result!=''){
						modelText += result
					}
				})
				.then(()=>wcliExecuter([
						"archive",
						"-l",
						"-r",
						"^\\b(ep1|base)\\b.\\b(characters|environment|items|vehicles|weapons)\\b.+(?!proxy).+\\.mesh$",
						"-p",
						path.normalize(path.join(gameContent,"archive\\pc\\ep1"))
					],{}))
				.then((result)=>{
					if (result!=''){
						modelText += result
					}
					mainWindow.webContents.send('preload:logEntry',`Vanilla archives listing complete`,false);
				})
				.then(()=>{
					const objDB = buildModelDB(modelText)
					//Sort models
					objDB.models.sort((x,y)=>{
								return x.file.localeCompare(y.file);
							})
					const JsonDBModel = JSON.stringify(objDB,null,0);

					const customDB = path.join(app.getAppPath(),"jsons/cliModelsDB.json");
					const customModelsWrite = fileWriter(customDB,JsonDBModel);

					customModelsWrite.then((result)=>{
						mainWindow.webContents.send('preload:logEntry', 'Model database saved',false)
					}).catch((error)=>{
						mainWindow.webContents.send('preload:logEntry', `Model database save error ${error}`,true)
					}).finally(()=>{
						mainWindow.webContents.send('preload:logEntry', `The model database has been rebuilt`,false);
					})
				})
				.catch((error)=>{
					 mainWindow.webContents.send('preload:logEntry',`${error} `,true);
				}).finally((res)=>{
					//completed everything
					mainWindow.webContents.send('preload:noBar','');
				});

				// .\WolvenKit.CLI.exe archive -l -r '^\b(ep1||base)\b.\b(characters||environment||items||vehicles||weapons)\b.+(?!proxy).+\.mesh$' -p "C:\Program Files (x86)\GOG Galaxy\Games\Cyberpunk 2077\archive\pc\content\" > ..\base.txt
				// .\WolvenKit.CLI.exe archive -l -r '^\b(ep1||base)\b.\b(characters||environment||items||vehicles||weapons)\b.+(?!proxy).+\.mesh$' -p "C:\Program Files (x86)\GOG Galaxy\Games\Cyberpunk 2077\archive\pc\ep1\" > ..\ep1.txt
			}
		}
	)
}

ipcMain.on('main:genModelListDB',(event,datas)=>{
	genModelListDB();
})


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
				mainWindow.webContents.send('preload:logEntry',`using the preference path for the game folder in ${gameContentPath}`)
				var archiveFilter = microBuilder(gameContentPath)
			}else{
				let archive = dialog.showOpenDialog({title:'Select the game folder',properties: ['openDirectory'],defaultPath:app.getPath('desktop')})
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
	return new Promise((resolve,reject) =>{

			let unbundlefoWkit = preferences.get('paths.depot') //String(preferences.get('unbundle')).replace(/base$/,'')
			let uncooker = preferences.get('paths.wcli')
			var countingOnYou = 0

			if (uncooker.match(/.+WolvenKit\.CLI\.exe$/)){
				mainWindow.webContents.send('preload:UImanager',{command:"reset",target:"#microLogger div"})
				wcliExecuter(["uncook", "-gp", contentdir, "-r","^base.surfaces.microblends.+(?!proxy).+\.xbm$","--uext","png","-o",unbundlefoWkit],{
					log:true,
					logTarget:"UI",
					logger:"#microLogger div",
					bar:"micro_opt01",
				})
					.then(()=> {
						return listMBlends();
					})
					.then((files)=>{
						try{
							resizeMblends(files,true);
						}catch(err){
							mainWindow.webContents.send("preload:UImanager",
								{
									command:"prepend",
									target:	"#microLogger div",
									content:`${err}`
								})
						}
					})
					.catch((err)=>{
						mainWindow.webContents.send("preload:UImanager",
							{
								command:"prepend",
								target:	"#microLogger div",
								content:`${err}`
							})
					})
					.finally(() => {
						mainWindow.webContents.send('preload:UImanager',{command:"hide",target:"#mycroCog"})
						mainWindow.webContents.send('preload:UImanager',{command:"enable",target:"#MycroMe"})
						//mainWindow.webContents.send('preload:UImanager',{command:"hide",target:"#uncookMicro"})
						mainWindow.webContents.send('preload:trigEvent',{target:"body", trigger:'updateMBlends'});
					})
			}
	})
}

async function list_files(path,options){
	return dree.scanAsync(path,options);
}

async function listMaterials(){
	const depotfiles = `${preferences.get('paths.depot')}/`
	fs.access(depotfiles,(err)=>{
		if (!err){
			const options = {
				stat:false,
				followLinks:false,
				hash:true,
				sizeInBytes: false,
				size: false,
				normalize: true,
				extensions: ["json"],
				excludeEmptyDirectories:true,
				matches:/.+\.mltemplate\.json$/
			}
			list_files(depotfiles,options)
			.then(function (tree) {
				console.log(tree)
			});

		}
		return `Path not accessible : ${depotfiles}`;
	})
}
/* const a = await listMaterials() */



function listMBlends(){
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
}

function resizeMblends(mblends,bars=false){
	var perc = Number(100/mblends.length).toFixed(2)
	var k = 1
	mblends.forEach((png)=>{
		sharp(path.join(String(preferences.get('paths.depot')),'base/surfaces/microblends/',png))
			.resize(256)
			.toFile(path.join(app.getAppPath(),'images/',png).replace('app.asar', 'app.asar.unpacked'), (err, info) => {
				if(err){
					if (bars){
						mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger div')
					}else{
						mainWindow.webContents.send('preload:logEntry',`${err}`,false)
					}
				}else{
					if (bars){
						mainWindow.webContents.send('preload:uncookBar',String(Math.round(Number(perc * k))),'mresize')
					}
				}
			})
			.resize(64)
			.toFile(path.join(app.getAppPath(),'images/thumbs/',png).replace('app.asar', 'app.asar.unpacked'), (err, info) => {
				if(err){
					if (bars){
						mainWindow.webContents.send('preload:uncookErr',`${err}`,'#microLogger div')
					}else{
						mainWindow.webContents.send('preload:logEntry',`${err}`,false)
					}
				}else{
					if (bars){
						mainWindow.webContents.send('preload:uncookBar',String(Math.round(Number(perc * k))),'mthumbs')
					}
				}
			})
		k++
	})
}

ipcMain.on('main:resmBlend',(event)=>{
	if (itMigrate){
		var listed = listMBlends();
		listed.then((files)=>{
			try{
				resizeMblends(files);
			}catch(err){
				 mainWindow.webContents.send('preload:logEntry',`${err}`,true)
			}
		})
		.catch((err)=>{
			 mainWindow.webContents.send('preload:logEntry',`${err}`,true)
		})
		.finally(() => {
			mainWindow.webContents.send('preload:trigEvent',{target:"body", trigger:'updateMBlends'});
		})
	}
});

ipcMain.on('main:mBlender',(event,box)=>{
	var pathPackage = path.join(app.getPath('userData'),userResourcesPath,userRScheme[_microblends],box.packageName.toLowerCase())
	var folderPackage = path.join(app.getAppPath(),'images/mblend/',box.packageName.toLowerCase())

	try{
		if (box.files.length>0){
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

			box.files.forEach((mblend,index)=>{
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
							 mainWindow.webContents.send('preload:logEntry',`${mblend.name} processed for package ${box.packageName}`)
						 }
					})
					.resize(64)
					.toFile(path.join(folderPackage,'/thumbs/',mblend.name), (err, info) => {
							if(err){
								mainWindow.webContents.send('preload:logEntry',`${err}`,true)
							}else{
								mainWindow.webContents.send('preload:logEntry',`Thumbs for ${mblend.name} processed for package ${box.packageName}`)
							}
					 })
				}
			})
			JsonResourceRead(userRfiles.microblends)
			.then((contenuto)=>{
				let listaPath = box.files.map(elm => {return {"path":elm.gamepath,"hash":elm.hash}})
				let indexPackage = contenuto.packages.findIndex((pkg,index) => {
					 if (pkg.name==box.packageName){ return true }
					 return false
					})
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
					contenuto.packages.push({"name":box.packageName,"microblends":listaPath})
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
	var pathPackage = path.join(app.getPath('userData'),userResourcesPath,userRScheme[_microblends],micro["package"].toLowerCase())
	var folderPackage = path.join(app.getAppPath(),'images/mblend/',micro["package"].toLowerCase())

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
			let indexPackage = contenuto.packages.findIndex((pkg,index) => { if (pkg.name==micro["package"]){ return index	}})
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

function mlMaskNameExplode(maskTemplate){
	const ext = preferences.get("maskformat");
	const response = {
			customPath: "",
			filetemplate: "",
			actuallayer: "",
			maskslayers: [],
			extension: ext
		}
	try{
		response.customPath = maskTemplate.split("\\").slice(0,-1).join("\\");
		response.filetemplate = maskTemplate.split("\\").pop().toString();
		response.actuallayer = response.filetemplate.replace(".mlmask",`_\\d+\\.${ext}$`)
	}catch(error){
		mainWindow.webContents.send('preload:logEntry',`fn > mlmask name explosion - ${error}`,true)
	}
	return response
}

ipcMain.handle('main:getMasksset',(ev,maskTemplate)=>{

});

ipcMain.handle('main:findMasks',(ev, maskTemplate)=>{
	return new Promise((resolve,reject)=>{
		var actualfile, fileTemplate, customPath, maskLayers
		let temp = mlMaskNameExplode(maskTemplate)

		actualfile = temp.actuallayer
		fileTemplate = temp.filetemplate
		customPath = temp.customPath
		maskLayers = temp.maskslayers
		
		try {
			var test = path.join(preferences.get('paths.depot'),customPath)

			const options = {
				stat:false,
				followLinks:false,
				hash:true,
				sizeInBytes: false,
				size: false,
				normalize: true,
				extensions: [temp?.extension],
				excludeEmptyDirectories:true,
				matches:new RegExp(actualfile)
			}

			list_files(test,options)
			.then(function (tree) {
				
				if (tree?.children.length > 0){
					
/* 					const allLayers = Array(20).fill(false,0,19);
					const onlyFileNames = tree.children.map((x)=> x.name )
					//generate the list of files of the masks
					for(let i=0 , j=tree.children.length; i < j; i++){

						let unmaskedFile = actualfile.replace("\\d+\\",i).replace("$","")
						if (onlyFileNames.includes(unmaskedFile)){
							allLayers[i] = unmaskedFile
						}
					} */

					resolve(tree.children.length)
				}
				resolve(0)
			}).catch((error)=>{
				log.info(`${actualfile} not found`);
				mainWindow.webContents.send('preload:logEntry',`${error}`,true)
				resolve(0)
			});
		} catch (error) {
			mainWindow.webContents.send('preload:logEntry',`${error}, '${maskTemplate}'`);
			reject(false);
		}
	})
});

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


