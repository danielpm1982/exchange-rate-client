/*
Any 'new-window' window will be created with 'nodeIntegration' set to false, 'contextIsolation' set 
to true, 'enableRemoteModule' set to false and 'experimentalFeatures' set to false (see main process 
index.ts).
This should keep a safe and secure separation between the renderer process context (mainWorld) and 
the app internal context (isolatedWorld). This internal context includes the preload scripts (preload 
window objects will be different from renderer window objects, for instance) and the main process 
script. Node-based APIs, including Electron API, will not be available at the renderer, except through 
the registered preload scripts, where any API manipulation can be controlled and limited to its actual 
purposes for the renderer to use it - exposing only what's needed, custom functions, for ex., not the 
entirely or even any of the node APIs modules themselves.
Require or import won't work on the renderer scripts, only at the preload scripts and at the main 
process script.
Any node API module should be imported, manipulated and have only limited necessary functions and 
returning data exposed to the renderer, by using the contextBridge, as below.
The script here will constitute a custom API that will be set as a global object of the renderer window, 
and all its exposed elements will be accesible, as properties, from the renderer process, through that 
API object. For instance, at the renderer process, you'd use 'window.danielpm1982API.someFunction()',
exposed below.
*/

const { contextBridge } = require('electron')

// ... some other imports and modules manipulation... 
// ... some creation of custom functions to be exposed, for example...

contextBridge.exposeInMainWorld("danielpm1982API", {
    // ... expose of properties and elements (data, functions, promisses, etc) for the renderer to use
})

// For more see:
// https://www.electronjs.org/docs/tutorial/context-isolation
// https://www.electronjs.org/docs/api/context-bridge
// https://www.electronjs.org/docs/tutorial/security
