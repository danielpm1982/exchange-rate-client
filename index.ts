const electron = require('electron'); 

// Module to control application life. 
const app = electron.app; 

// Module to create native browser window. 
const BrowserWindow = electron.BrowserWindow; 

// Module to create a communicator with the renderer processes. 
const ipcMain =  electron.ipcMain;

// Keep a global reference of the window object,  
// if you don't, the window will be closed automatically 
// when the JavaScript object is garbage collected. 
let mainWindow:any = null; 

let aboutModalWindow:any = null;

// Quit when all windows are closed. 
app.on('window-all-closed', function() 
{ 
  // On OS X it is common for applications and their 
  // menu barto stay active until the user quits  
  // explicitly with Cmd + Q if (process.platform != 'darwin') 
  { 
    app.quit(); 
  } 
}); 

// This method will be called when Electron has finished 
// initialization and is ready to create browser windows. 
app.on('ready', function() { 
  // Create the browser main window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  }); 
  
  // Create the browser about modal window
  aboutModalWindow = new BrowserWindow({
    width: 650,
    height: 400,
    parent: mainWindow,
    modal: true,
    resizable: false,
    frame: false,
    movable: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app on main window. 
  mainWindow.loadFile("app/index.html"); 
  
  // and load the about.html of the app on about modal window. 
  aboutModalWindow.loadFile("app/about.html"); 

  // show window only when all content is loaded.
  mainWindow.once("ready-to-show", mainWindow.show);
  
  // show window only when all content is loaded.
  aboutModalWindow.once("ready-to-show", function(){
    setTimeout(() => {
      aboutModalWindow.show();
      // close aboutModalWindow when a click event happens at the renderer. 
      ipcMain.on('close-about-window', (e: Event) => {
        aboutModalWindow.close();
      })
      setTimeout(() => {
        if(aboutModalWindow)
          aboutModalWindow.close();
      }, 10000);
    }, 1000);
  });
  
  // Open the DevTools. 
  // mainWindow.webContents.openDevTools();
  
  // Emitted when the main window is closed. 
  mainWindow.on('closed', function() { 
    // Dereference the window object, usually you 
    // would store windows in an array if your 
    // app supports multi windows, this is the time 
    // when you should delete the corresponding element. 
    mainWindow = null; 
  });
  
  // Emitted when the about modal window is closed. 
  aboutModalWindow.on('closed', function() { 
    aboutModalWindow = null; 
  });
});
