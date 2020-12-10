import { ipcRenderer } from 'electron'
const closeElement = document.getElementById('close')! as HTMLImageElement
closeElement.addEventListener("click", () => {
    ipcRenderer.send("close-about-window")
})
closeElement.setAttribute('title', 'click to close')
