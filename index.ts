const { app, BrowserWindow, ipcMain, dialog, session, globalShortcut, Notification, Menu, Tray, nativeImage} = require('electron')
import { MenuItemConstructorOptions, powerMonitor, screen, shell } from 'electron'
import { Display, IpcMainEvent, IpcMainInvokeEvent, RenderProcessGoneDetails } from 'electron/main'
const windowStateKeeper = require('electron-window-state')
const fs = require('fs')
const path = require('path')
import ConversionRatesInterface from './app/ConversionRatesInterface'
import printOptions from './app/printOptions'

// Keep a global reference of the below objects,
// if you don't, they may be closed automatically 
// when the JavaScript object is garbage collected. 
let mainWindow: Electron.BrowserWindow | null
let aboutModalWindow: Electron.BrowserWindow | null
let tray: Electron.Tray | null
let primaryDisplay: Display

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
        shell.openPath(pathToSave)
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

  // Create, set and show a new BrowserWindow when 'new-window' event occurs from the mainWindow 
  // renderer process
  mainWindow.webContents.on('new-window', (event, url, _frameName, _disposition, _options, 
    _additionalFeatures, _referrer, _postBody) => {
    event.preventDefault()
    const newWindow = new BrowserWindow({
      width: primaryDisplay.size.width/4.8,
      height: primaryDisplay.size.height/1.5,
      x: 0,
      y: 0,
      resizable: true,
      frame: true,
      movable: true,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        experimentalFeatures: false,
        zoomFactor: 1
      }
    })
    newWindow.loadURL(url)
    const websiteMenu = Menu.buildFromTemplate(menuItemConstructorOptionsArrayWebSiteWindow)
    newWindow.setMenu(websiteMenu)
    newWindow.webContents.on('context-menu', (_event: Event) => {
      websiteMenu.popup()
    })
    newWindow.on("ready-to-show", () => {
      newWindow.show()
      // newWindow.maximize()
    })
    // if the url is 'https://danielpm1982.com/', preventDefault() and send an IPCMain message for 
    // custom closing from the renderer process. For other urls proceed with standard closing
    newWindow.on("close", (event: Event) => {
      if(url === "https://danielpm1982.com/"){
        event.preventDefault()
        mainWindow!.webContents.send("closeWebSiteWindowAndResetWebSiteImg")
      }
    })
    event.newGuest = newWindow
  })

  // Open the DevTools. 
  // mainWindow.webContents.openDevTools()

  // Avoid user exiting through 'Alt+F4' shortcut, and instruct him to use 'CommandOrControl+F4'
  // if he really wanna exit the app. As as global shortcut, the mainWindow or the app do not
  // need to be focused for the event to occur and be listened. These global shortcuts are removed
  // in the 'window-all-closed' event listener, set above, before the app quits, for not affecting
  // other applications. This restriction is merely for demonstrating purposes, not a real feature 
  // for this app. It can be simply commented out for allowing normal default closing.
  mainWindow.on("close", function(event: Event){
    event.preventDefault()
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

  // Reload mainWindow webContents on mainWindow renderer process crash
  mainWindow.webContents.on("render-process-gone", (_event: Event, details: RenderProcessGoneDetails) => {
    setTimeout(() => {
      mainWindow?.reload()
      new Notification({
        title: 'Exchange Rate Client App '+details.reason+" !",
        body: "Main window renderer process gone. Reason: "+details.reason+".\n\nMain window webContents reloaded !\n\nMain window renderer process restarted !"
      }).show()
      dialog.showMessageBox(mainWindow!, {
        type: "error",
        buttons: ["OK"],
        title: 'Exchange Rate Client App '+details.reason+" !",
        message: "Main window renderer process gone. Reason: "+details.reason+".\n\nMain window webContents reloaded !\n\nMain window renderer process restarted !"
      })
    }, 1000);
  })

  // Create and set a menu to the mainWindow based on the MenuItemConstructorOptions array 
  // template. Set that same menu both as a main Menu to the mainWindow directly as well as 
  // like a popup context menu responsive to the mainWindow webcontents 'context-menu' event
  // (right-button clicked event). Also create the app Tray and set the same menu as the tray menu.
  const menu = Menu.buildFromTemplate(menuItemConstructorOptionsArray)
  mainWindow.setMenu(menu)
  mainWindow.webContents.on('context-menu', (_event: Event) => {
    menu.popup()
  })
  const pathTotrayIcon = path.join(__dirname, "app", "icon", "iconLinux.png") as string
  const trayIconNativeImage = nativeImage.createFromPath(pathTotrayIcon)
  // tray = new Tray(pathTotrayIcon) //or
  tray = new Tray(trayIconNativeImage)
  tray.setToolTip('Exchange Rate Client')
  tray.setContextMenu(menu)
  tray.setIgnoreDoubleClickEvents(true)

  // Use powerMonitor to execute sample callback functions actions uppon power events, 
  // for example, as 'suspend' and 'resume' power events occur. In this case, save the
  // current rate results (if any) on suspending and reset the app defaults on resuming
  powerMonitor.on('suspend', () => {
    mainWindow?.webContents.send("rateResultStatusRequestFromMain")
    ipcMain.once('rateResultStatusResponseFromIndex', (event: IpcMainEvent, response: boolean) => {
      //if there are current rate results, print them to a pdf file before suspending
      if(response){
        // mainWindow?.webContents.send("printToPDFFromMain") //or
        // event.sender.send("printToPDFFromMain") //or
        event.reply("printToPDFFromMain")
      }
    })
  })
  powerMonitor.on('resume', () => {
    // clear existing rate results and set app props to default on resuming
    mainWindow?.webContents.loadFile("app/index.html")
    new Notification({
      title: 'System Resumed from Suspension !',
      body: "In case there were previous rate results, these have been saved to a Dekstop PDF file before suspending. App data has been reset on resuming."
    }).show()
    dialog.showMessageBox(mainWindow!, {
      type: "info",
      buttons: ["OK"],
      title: 'System Resumed from Suspension !',
      message: "In case there were previous rate results, these have been saved to a Desktop PDF file before suspending. App data has been reset on resuming."
    })
  })
}

// Create and set aboutModelWindow properties, default session and event listeners
function createAboutModelWindow(): void {
  // Create the browser about modal window based on the screen primaryDisplay size
  aboutModalWindow = new BrowserWindow({
    width: primaryDisplay.size.width/4.7,
    height: primaryDisplay.size.height/1.8,
    center: true,
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
  ipcMain.on('close-about-window', (_event: IpcMainEvent) => {
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
  // Get primaryDisplay for later get its properties, as width and height
  primaryDisplay = screen.getPrimaryDisplay()
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
// ipcMain event listeners settings (listeners to the renderer processes events):
// ******************************************************************************************

ipcMain.on("printFromIndex", (event: IpcMainEvent, ratesResultObject: {lastUpdated: string, currencyCode: string, ratesResult: ConversionRatesInterface}) => {
  // eventually process ratesResultObject at the main process side, then change mainWindow webContents file 
  // to indexPrint.html, sending back a message to this same window, with the changed ratesResultObject, for 
  // printing that to the default available printer. If none is available show a notification and a dialog 
  // message modal box.
  mainWindow?.webContents.loadFile("app/indexPrint.html").then( () => {
    // mainWindow?.webContents.send("showRatesResult", ratesResultObject) //or
    // event.sender.send("showRatesResult", ratesResultObject) //or
    event.reply("showRatesResult", ratesResultObject)
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

ipcMain.on("printToPDFFromIndex", (event: IpcMainEvent, ratesResultObject: {lastUpdated: string, currencyCode: string, ratesResult: ConversionRatesInterface}) => {
  // eventually process ratesResultObject at the main process side, then change mainWindow webContents file 
  // to indexPrint.html, sending back a message to this same window, with the changed ratesResultObject, for 
  // printing that to a pdf file at the desktop.
  mainWindow?.webContents.loadFile("app/indexPrint.html").then( () => {
    // mainWindow?.webContents.send("showRatesResult", ratesResultObject) //or
    // event.sender.send("showRatesResult", ratesResultObject) //or
    event.reply("showRatesResult", ratesResultObject)
    mainWindow?.webContents.printToPDF({}).then( data => {
      const date = new Date()
      const dateString = date.toDateString()+" "+date.getHours()+"h "+date.getMinutes()+"m "+date.getSeconds()+"s"
      const pdfPath = path.join(app.getPath("desktop"), "rate-results-"+dateString+".pdf")
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

ipcMain.on("saveScreenCapture", (event: IpcMainEvent, fileBuffer: Buffer) => {
  const date = new Date()
  const dateString = date.toDateString()+" "+date.getHours()+"h "+date.getMinutes()+"m "+date.getSeconds()+"s"
  const filePath = path.join(app.getPath("desktop"), "exchangeRate-"+dateString+".png")
  fs.writeFile(filePath, fileBuffer, (error:Error) => {
    if(error){
      event.returnValue = null
      new Notification({
        title: 'Error saving captured screen !',
        body: error.message
      }).show()
      dialog.showErrorBox(
        'Error saving captured screen !',
        error.message
      )
    } else{
      event.returnValue = filePath
      new Notification({
        title: 'Screen captured successfully !',
        body: "PNG file saved at: "+filePath+" ."
      }).show()
      dialog.showMessageBox(mainWindow!, {
        type: "info",
        buttons: ["OK"],
        title: 'Screen captured successfully !',
        message: "PNG file saved at: "+filePath+" ."
      })
    }
  })
})

ipcMain.handle("/index", (_event: IpcMainInvokeEvent) => {
  mainWindow?.webContents.loadFile("app/index.html")
  return "app/index.html"
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
        type: 'separator'
      },
      {
        label: 'SendRateResultsToClipboard',
        accelerator: 'CommandOrControl+Shift+S',
        click: () => {
          mainWindow?.webContents.send("sendRateResultsToClipboardFromMain")
        }
      },
      {
        label: 'ClearClipboard',
        accelerator: 'CommandOrControl+Shift+L',
        click: () => {
          mainWindow?.webContents.send("clearClipboardFromMain")
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'ScreenCapture',
        accelerator: 'CommandOrControl+T',
        click: () => {
          mainWindow?.webContents.send("screenCaptureFromMain")
        }
      },
      {
        label: 'Download Logo',
        accelerator: 'CommandOrControl+G',
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
    role: 'editMenu',
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
            },
            accelerator: 'CommandOrControl+Shift+W',
          },
          {
            label: 'Black Theme',
            click: () => {
              mainWindow?.webContents.send('blackThemeFromMain')
            },
            accelerator: 'CommandOrControl+Shift+B',
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
        label: 'Process and System Info',
        click: () => {
          mainWindow?.webContents.send("processFromMain")
        },
        accelerator: 'CommandOrControl+I'
      },
      {
        type: 'separator'
      },
      {
        label: 'Visit Website',
        click: () => {
          shell.openExternal("https://www.danielpm1982.com")
        },
        accelerator: 'CommandOrControl+W'
      },
      {
        label: 'Send Email',
        click: () => {
          shell.openExternal("mailto:danielpm1982.com@domainsbyproxy.com")
          .catch(error => {
            dialog.showMessageBox(mainWindow!, {
              type: "error",
              buttons: ["OK"],
              title: 'Error sending email !',
              message: "Could not send email to: mailto:danielpm1982.com@domainsbyproxy.com ."
            })
          })
        },
        accelerator: 'CommandOrControl+E'
      },
      {
        type: 'separator'
      },
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

const menuItemConstructorOptionsArrayWebSiteWindow: MenuItemConstructorOptions[] = [
  {
    role: 'editMenu',
  },
  {
    role: 'viewMenu',
  },
  {
    role: 'window',
    submenu: [{
      role: 'close',
      accelerator: 'CommandOrControl+L'
    }]
  }
]
