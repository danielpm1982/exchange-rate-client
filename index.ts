const { app, BrowserWindow, ipcMain, dialog } = require('electron'); 
import { Notification } from 'electron'
const windowStateKeeper = require('electron-window-state')
const fs = require('fs')
const path = require('path')
const os = require('os')
import ConversionRatesInterface from './app/ConversionRatesInterface'
import printOptions from './app/printOptions'

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

ipcMain.on("printFromIndex", (event: Event, ratesResultObject: {lastUpdated: string, currencyCode: string, ratesResult: ConversionRatesInterface}) => {
  // eventually process ratesResult at the main process side, then change the
  // mainWindow webContents file to indexPrint.html, send back the ratesResult 
  // to the renderer side of this window and print that to the default available 
  // printer. If none is available show a notification and a dialog message modal box.
  mainWindow?.webContents.loadFile("app/indexPrint.html").then( () => {
    mainWindow?.webContents.send("showRatesResult", ratesResultObject)
    mainWindow?.webContents.print(printOptions as Electron.WebContentsPrintOptions, (success: boolean, failureReason: string) => { 
      if (!success){
        new Notification({
          title: 'Error printing',
          body: failureReason
        }).show()
        dialog.showMessageBox(mainWindow!, {
          type: "error",
          buttons: ["OK"],
          title: "Error printing",
          message: failureReason+". Please check if your printer is installed and set as a default printer at your Operating System, and try again !"
        })
      } else{
        new Notification({
          title: 'Printing done !',
          body: "Printing process successfully executed !"
        }).show()
        dialog.showMessageBox(mainWindow!, {
          type: "info",
          buttons: ["OK"],
          title: "Printing done !",
          message: "Printing process successfully executed !"
        })
      }
    });
  })
})

ipcMain.on("printToPDFFromIndex", (event: Event, ratesResult: string) => {
  // eventually process ratesResult at the main process side, then change the
  // mainwindow webContents file to indexPrint.html, send back the ratesResult 
  // to the renderer side of this window and print that to a pdf file at the desktop.
  mainWindow?.webContents.loadFile("app/indexPrint.html").then( () => {
    mainWindow?.webContents.send("showRatesResult", ratesResult)
    mainWindow?.webContents.printToPDF({}).then( data => {
      const pdfPath = path.join(os.homedir(), 'Desktop', "rate-results.pdf")
      fs.writeFile(pdfPath, data, (error:Error) => {
        if(error){
          throw error
        } else{
          new Notification({
            title: 'Printing to PDF done !',
            body: "Printing to PDF process successfully executed ! Content saved at: "+pdfPath+" ."
          }).show()
          dialog.showMessageBox(mainWindow!, {
            type: "info",
            buttons: ["OK"],
            title: 'Printing to PDF done !',
            message: "Printing to PDF process successfully executed ! Content saved at: "+pdfPath+" ."
          })
        }
      })
    }).catch(error => {
      new Notification({
        title: 'Error printing',
        body: error.message
      }).show()
      dialog.showMessageBox(mainWindow!, {
        type: "error",
        buttons: ["OK"],
        title: "Error printing to PDF",
        message: error.message+". Please check your pdf printer at your Operating System, and try again !"
      })
    })
  })
})

ipcMain.on("/index", (_event: Event) => {
  mainWindow?.webContents.loadFile("app/index.html")
})
