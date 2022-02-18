// main.js
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, nativeTheme, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const store = require('electron-store');

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

//setup for the file path configurationa
/*let configfile, default_config, configJson
configfile ='mlconfig.json'
default_config = {'unbundle':''}
configJson = JSON.stringify(default_config)*
*/
const createModal = (htmlFile, parentWindow, width, height, title='MlsetupBuilder') => {
  let modal = new BrowserWindow({
    width: width,
    height: height,
    modal: true,
    parent: parentWindow,
		webPreferences: {
			preload: path.join(__dirname, 'apps/preloadpref.js'),
		},
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

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
			{label: '&Preferences', click: () =>{
				createModal("apps/prefs.html",mainWindow,800,300,'Preferences');
			}},
			{ type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
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
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [{label:'License',click: () =>{
				mainWindow.webContents.send('preload:openlicense')
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
  mainWindow.webContents.openDevTools()
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
        dialog.showErrorBox("File opening error","The searched file does not exists "+path.join(preferences.get('unbundle'),percorso))
      }else{
        dialog.showErrorBox("File opening error",err.message)
      }
      contenutofile=""
    }
    event.returnValue = contenutofile
  })
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
	if (arg.type=='mlsetup'){
		const salvataggio = dialog.showSaveDialog({
			title:'Save the mlsetup jsonized',
			defaultPath: arg.file,
			filters:[ { name: 'All Files', extensions: ['*'] },	{ name: 'Jsons', extensions: ['json'] } ],
			properties: ['createDirectory']
		}).then(salvataggio => {
		    if (!salvataggio.canceled){
					fs.writeFile(salvataggio.filePath, arg.content,'utf8',(errw,data) =>{
						if(errw){
							dialog.showErrorBox('Error during the writing process of the file')
							return
						}
					})
					event.reply('preload:logEntry', 'File saved in: '+salvataggio.filePath+'\n')
				}else{
					event.reply('preload:logEntry', 'Save procedure cancelled')
				}
		})
	}
});

//Get request for stored preferences values
ipcMain.handle('main:getStoreValue', (event, key) => {
	if (key===undefined){
		return preferences.store;
	}else{
		return preferences.get(key);
	}
});
