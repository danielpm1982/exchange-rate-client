const { app, BrowserWindow, ipcMain, dialog, session, globalShortcut, Notification, Menu, Tray } = require('electron')
import { MenuItemConstructorOptions } from 'electron'
const windowStateKeeper = require('electron-window-state')
const fs = require('fs')
const path = require('path')
import ConversionRatesInterface from './app/ConversionRatesInterface'
import printOptions from './app/printOptions'

// Keep a global reference of the window and tray object,
// if you don't, the window will be closed automatically 
// when the JavaScript object is garbage collected. 
let mainWindow: Electron.BrowserWindow | null
let aboutModalWindow: Electron.BrowserWindow | null
let tray: Electron.Tray | null

// ******************************************************************************************
// BrowserWindow instances creation and setting:
// ******************************************************************************************

// Create and set mainWindow properties, custom session, state management and event listeners
function createMainWindow(): void {
  // Create an object, through the windowStateKeeper() function, and set 
  // the default values of width and height that, by default, the managed 
  // window should have set initially, if no other stored values are 
  // available at the winState object
  let winState = windowStateKeeper({
    defaultWidth: 1143,
    defaultHeight: 800,
  })
  
  // Create/Set webcontent custom session for mainWindow to use, and through the 
  // 'will-download' event set a default download path - which prevents default 
  // behavior of the download of the anchor html tag by default
  const customSessionPart1 = session.fromPartition("persist:part1")
  customSessionPart1.on("will-download", (_event, item, _webContents) => {
    const pathToSave = path.join(app.getPath("desktop"), "logoExchangeRateAPI.png") as string
    console.log("saving to path: "+pathToSave)
    item.setSavePath(pathToSave)
    item.on('updated', (_event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (_event, state) => {
      console.log("final state: "+state)
      if (state === 'completed') {
        console.log('Download successfully')
        new Notification({
          title: state.charAt(0).toUpperCase()+state.slice(1),
          body: 'Download successfull ! File downloaded to path\n'+pathToSave
        }).show()
        dialog.showMessageBox(mainWindow!, {
          type: 'info',
          buttons: ["OK"],
          title: state.charAt(0).toUpperCase()+state.slice(1),
          message: 'Download successfull ! File downloaded to path\n'+pathToSave
        })
      } else {
        console.log(`Download failed: ${state}`)
        new Notification({
          title: state.charAt(0).toUpperCase()+state.slice(1),
          body: 'Download failed !'
        }).show()
        dialog.showErrorBox(
          state.charAt(0).toUpperCase()+state.slice(1),
          'Download failed !'
        )
      }
    })
  })

  // Create the browser main window based on stored props values 
  // (width, height, x and y) from the winState object created above.
  // If no custom values exist, saved from the last app user usage,
  // use the default winState values. Set the session customly on webPreferences
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
      nodeIntegration: true,
      session: customSessionPart1
    }
  })

  // sets the window whose position and move events will be listened to
  // by the winState object that will manage the storing and retrieval
  // of those values on the next app execution
  winState.manage(mainWindow)

  // and load the index.html of the app on main window. 
  mainWindow.loadFile("app/index.html")

  // show window only when all content is loaded.
  mainWindow.once("ready-to-show", mainWindow.show)

  // Open the DevTools. 
  // mainWindow.webContents.openDevTools()

  // Avoid user exiting through 'Alt+F4' shortcut, and instruct him to use 'CommandOrControl+F4'
  // if he really wanna exit the app. As as global shortcut, the mainWindow or the app do not
  // need to be focused for the event to occur and be listened. These global shortcuts are removed
  // in the 'window-all-closed' event listener, set above, before the app quits, for not affecting
  // other applications. This restriction is merely for demonstrating purposes, not a real feature 
  // for this app. It can be simply commented out for allowing normal default closing.
  mainWindow.on("close", function(e: Event){
    e.preventDefault()
    dialog.showMessageBox(mainWindow!, {
      type: "warning",
      buttons: ["OK"],
      title: "Closing this mainWindow will close the app !",
      message: "If you wanna leave this app, please use the 'CommandOrControl+F4' shortcut instead of 'Alt+F4' !"
    })
  })
  globalShortcut.register("CommandOrControl+F4", () => {
    mainWindow?.removeAllListeners("close")
    mainWindow?.close()
  })

  // Emitted when the main window is closed. 
  mainWindow.on('closed', function() { 
    // Dereference the window object, usually you 
    // would store windows in an array if your 
    // app supports multi windows, this is the time 
    // when you should delete the corresponding element. 
    mainWindow = null
  })

  // Create and set a menu to the mainWindow based on the MenuItemConstructorOptions array 
  // template. Set that same menu both as a main Menu to the mainWindow directly as well as 
  // like a popup context menu responsive to the mainWindow webcontents 'context-menu' event
  // (right-button clicked event). Also create the app Tray and set the same menu as the tray menu.
  const menu = Menu.buildFromTemplate(menuItemConstructorOptionsArray)
  mainWindow.setMenu(menu)
  mainWindow.webContents.on('context-menu', (e: Event) => {
    menu.popup()
  })
  const pathTotrayIcon = path.join(__dirname, "app", "icon", "iconLinux.png") as string
  tray = new Tray(pathTotrayIcon)
  tray.setToolTip('Exchange Rate Client')
  tray.setContextMenu(menu)
  tray.setIgnoreDoubleClickEvents(true)
}

// Create and set aboutModelWindow properties, default session and event listeners
function createAboutModelWindow(): void {
  // Create the browser about modal window
  aboutModalWindow = new BrowserWindow({
    width: 650,
    height: 470,
    parent: mainWindow!,
    modal: true,
    resizable: false,
    frame: false,
    movable: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  
  // and load the about.html of the app on about modal window. 
  aboutModalWindow.loadFile("app/about.html")

  aboutModalWindow.once("ready-to-show", () => {
    // show window only when all content is loaded.
    aboutModalWindow?.show()
    aboutModalWindow?.setAlwaysOnTop(true, "floating")
    mainWindow?.setOpacity(0.3)
  })

  // close aboutModalWindow when a click event happens at the renderer or timeout is reached
  ipcMain.on('close-about-window', (e: Event) => {
    aboutModalWindow?.close()
    mainWindow?.setOpacity(1) //opacity only works on windows and iOS, not on linux
  })
  const timeOut = setTimeout(() => {
      aboutModalWindow?.close()
      mainWindow?.setOpacity(1) //opacity only works on windows and iOS, not on linux
  }, 10000)

  // Emitted when the about modal window is closed. 
  aboutModalWindow.on('closed', function() {
    clearTimeout(timeOut)
    ipcMain.removeAllListeners("close-about-window")
    aboutModalWindow = null
  })
}

// ******************************************************************************************
// app event listeners setting:
// ******************************************************************************************

// This method will be called when Electron has finished 
// initialization and is ready to create browser windows. 
app.on('ready', function() {
  createMainWindow()
  createAboutModelWindow()
})

// Quit when all windows are closed. 
app.on('window-all-closed', function() 
{ 
  // On OS X it is common for applications and their 
  // menu barto stay active until the user quits  
  // explicitly with Cmd + Q if (process.platform != 'darwin') 
  {
    globalShortcut.unregisterAll()
    app.quit()
  } 
})

// ******************************************************************************************
// ipcMain event listeners setting (listeners to the renderer processes events):
// ******************************************************************************************

ipcMain.on("printFromIndex", (_event: Event, ratesResultObject: {lastUpdated: string, currencyCode: string, ratesResult: ConversionRatesInterface}) => {
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
        dialog.showErrorBox(
          "Error printing",
          failureReason+". Please check if your printer is installed and set as a default printer at your Operating System, and try again !"
        )
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
    })
  })
})

ipcMain.on("printToPDFFromIndex", (_event: Event, ratesResult: string) => {
  // eventually process ratesResult at the main process side, then change the
  // mainwindow webContents file to indexPrint.html, send back the ratesResult 
  // to the renderer side of this window and print that to a pdf file at the desktop.
  mainWindow?.webContents.loadFile("app/indexPrint.html").then( () => {
    mainWindow?.webContents.send("showRatesResult", ratesResult)
    mainWindow?.webContents.printToPDF({}).then( data => {
      const pdfPath = path.join(app.getPath("desktop"), "rate-results.pdf")
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
      dialog.showErrorBox(
        "Error printing to PDF",
        error.message+". Please check your pdf printer at your Operating System, and try again !"
      )
    })
  })
})

ipcMain.on("/index", (_event: Event) => {
  mainWindow?.webContents.loadFile("app/index.html")
})

// ******************************************************************************************
// MenuItemConstructorOptions array, or menu template, which is set above to the Menu object, 
// set, in turn, as the mainWindow Menu
// ******************************************************************************************

const menuItemConstructorOptionsArray: MenuItemConstructorOptions[] = [
  {
    role: 'fileMenu',
    submenu: [
      {
        label: 'Print',
        accelerator: 'CommandOrControl+P',
        click: () => {
          mainWindow?.webContents.send("printFromMain")
        }
      },
      {
        label: 'PrintToPDF',
        accelerator: 'CommandOrControl+Shift+P',
        click: () => {
          mainWindow?.webContents.send("printToPDFFromMain")
        }
      },
      {
        label: 'Download Logo',
        accelerator: 'CommandOrControl+Shift+L',
        click: () => {
          mainWindow?.webContents.send("downloadLogoFromMain")
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  },
  {
    role: 'editMenu'
  },
  {
    role: 'viewMenu',
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Theme',
        submenu: [
          {
            label: 'White Theme',
            click: () => {
              mainWindow?.webContents.send('whiteThemeFromMain')
            }
          },
          {
            label: 'Black Theme',
            click: () => {
              mainWindow?.webContents.send('blackThemeFromMain')
            }
          }
        ]
      }
    ]
  },
  {
    role: 'services',
    submenu: [
      {
        label: 'Exchange Rate',
        click: () => {
          mainWindow?.webContents.loadFile("app/index.html")
        },
        accelerator: 'CommandOrControl+S'
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'About',
        click: () => {
          createAboutModelWindow()
        },
        accelerator: 'CommandOrControl+U'
      }
    ]
  }
]
