const electron = require('electron'); 
const windowStateKeeper = require('electron-window-state')

// Module to control application life. 
const app = electron.app; 

// Module to create native browser window. 
const BrowserWindow = electron.BrowserWindow; 

// Module to create a communicator with the renderer processes. 
const ipcMain =  electron.ipcMain;

// Keep a global reference of the window object,  
// if you don't, the window will be closed automatically 
// when the JavaScript object is garbage collected. 
let mainWindow: Electron.BrowserWindow | null; 

let aboutModalWindow: Electron.BrowserWindow | null;

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
  
  // Create an object, through the windowStateKeeper() function, and set 
  // the default values of width and height that, by default, the managed 
  // window should have set initially, if no other stored values are 
  // available at the winState object
  let winState = windowStateKeeper({
    defaultWidth: 1143,
    deafultHeight: 800,
  })
  
  // Create the browser main window based on stored props values 
  // (width, height, x and y) from the winState object created above.
  // If no custom values exist, saved from the last app user usage,
  // use the default winState values.
  mainWindow = new BrowserWindow({
    // width: 1143,
    // height: 800,
    width: winState.width,
    height: winState.height,
    x: winState.x,
    y: winState.y,
    minWidth: 690,
    minHeight: 483,
    // maxWidth and maxHeight limit maximization of window on Windows, 
    // not only the manual resizing. On linux it works fine.
    // maxWidth: 1143,
    // maxHeight: 800,
    resizable: true,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // sets the window whose position and move events will be listened to
  // by the winState object that will manage the store and retrieval
  // of those values on the next app use
  winState.manage(mainWindow)

  // Create the browser about modal window
  aboutModalWindow = new BrowserWindow({
    width: 650,
    height: 470,
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
      aboutModalWindow!.show();
      mainWindow!.setOpacity(0.3);
      // close aboutModalWindow when a click event happens at the renderer. 
      ipcMain.on('close-about-window', (e: Event) => {
        aboutModalWindow!.close();
        mainWindow!.setOpacity(1); //opacity only works on windows and iOS, not on linux
      })
      setTimeout(() => {
        if(aboutModalWindow)
          aboutModalWindow.close();
          mainWindow!.setOpacity(1); //opacity only works on windows and iOS, not on linux
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
