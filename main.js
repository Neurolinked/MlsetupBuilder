// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, nativeTheme, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

var mljson = app.commandLine.getSwitchValue("open")
if (mljson ==''){
  mljson = app.commandLine.getSwitchValue("o")
}

//setup for the file path configuration
let configfile, default_config, configJson
configfile ='mlconfig.json'
default_config = {'unbundle':''}
configJson = JSON.stringify(default_config)
/*
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
        { role: 'selectAll' },
        { label: '&Preferences'}
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
    submenu: [{label:'License'}]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
*/
function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//scrittura file di cofnigurazione come da standard se inesistente
fs.readFile(path.join(app.getPath('userData'),configfile),'utf8',(err,data) =>{
  if (err) {
    if (err.code=='ENOENT'){
      fs.writeFile(path.join(app.getPath('userData'),configfile),configJson,'utf8',(errw,data) =>{
        if(errw){
          console.log('No permission to write in user folder and save preferences');
          return
        }
        console.log('Blank preferences installed')
      })
      return
    }
  }
})

//cambia la versione sulla pagina a seconda della versione dell'app
ipcMain.on('main:getversion', (event, payload) => {
    const versione = app.getVersion()
    event.reply('preload:setversion',versione)
})

//check the argument used and
ipcMain.on('main:getargs', (event, payload) => {
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
          event.reply('preload:setargs',mlsetup_content)
        })
      }
    })
  }
})

ipcMain.on('main:readPrefs',(event,payload) =>{
  fs.opendir(app.getPath('userData'),(err,data) => {
    if (err) {
      event.reply('preload:prefsOn','{"unbundle":""}\n')
      return
    }
    fs.readFile(path.join(app.getPath('userData'),configfile),'utf8',(err,data) =>{
      if (err) {
        if (err.code=='ENOENT'){
          fs.writeFile(path.join(app.getPath('userData'),configfile),'{"unbundle":""}\n','utf8',(errw,data) =>{
            if(errw){
              console.log('No permission to write in user folder and save preferences');
              return
            }
            console.log('Blank preferences installed')
            event.reply('preload:prefsOn','{"unbundle":""}')
          })
          return
        }
        return
      }
      event.reply('preload:prefsOn',data)
      if(data) {
          try {
              default_config =JSON.parse(data)
          } catch(e) {
              console.log(e); // error in the above string (in this case, yes)!
          }
      }
    })
  })
})


ipcMain.on('main:readFile',(event,percorso,flags)=>{
  fs.readFile(path.join(default_config.unbundle,percorso),flags,(err,contenutofile) =>{
    if (err) {
      if (err.code=='ENOENT'){
        dialog.showErrorBox("File opening error","The searched file does not exists "+path.join(default_config.unbundle,percorso))
      }else{
        dialog.showErrorBox("File opening error",err.message)
      }
      contenutofile=""
    }
    event.returnValue = contenutofile
  })
})

ipcMain.on('main:setupUnbundle',(event, arg) => {
  const result = dialog.showOpenDialog({title:'Choose the unbundle folder', properties: ['openDirectory'] }).then(result => {
    if (!result.canceled){
      default_config.unbundle = result.filePaths[0]

      let dummy = JSON.stringify(default_config)

      fs.writeFile(path.join(app.getPath('userData'),configfile),dummy,'utf8',(errw,data) =>{
        if(errw){
          dialog.showErrorBox('No permission to write in user folder to save preferences');
          return ""
        }else{
          event.reply('preload:prefsLoad', default_config.unbundle)
        }
      })
    }
  }).catch(err => {
    dialog.showErrorBox("Preferences error",err.message)
  })
})
