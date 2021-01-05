import { ipcRenderer } from 'electron'
import ConversionRatesInterface from './ConversionRatesInterface'
const resultPrintFormatList: HTMLElement = document.getElementById("resultPrintFormatList") as HTMLElement
const resultPrintFormatP: HTMLParagraphElement = document.getElementById("resultPrintFormatP") as HTMLParagraphElement
const homeDiv: HTMLDivElement = document.getElementById("homeDiv") as HTMLDivElement
const homeImg: HTMLImageElement = document.getElementById("home") as HTMLImageElement
ipcRenderer.on('showRatesResult', (_event: Event, ratesResultObject: {lastUpdated: string, currencyCode: string, ratesResult: ConversionRatesInterface}) => {
    resultPrintFormatP.textContent = `Updated: ${ratesResultObject.lastUpdated}`
    Object.entries(ratesResultObject.ratesResult).forEach( entry => {
        const otherCurrency = entry[0]
        const rate = entry[1]
        const li = document.createElement('li')
        li.appendChild(document.createTextNode(`1 ${ratesResultObject.currencyCode} = ${rate} ${otherCurrency}`))
        resultPrintFormatList.appendChild(li)
    })
})
homeImg.onclick = function() {
    const resourceChannel = "/index"
    ipcRenderer.invoke(resourceChannel)
    .then((resourcePath) => {
        alert("Resource '"+resourceChannel+"' at '"+resourcePath+"' successfully loaded !")
    })
    .catch((error: Error) => {
        alert("Error loading resource: '"+resourceChannel+"' via IPC !")
    })
}
homeDiv.onpointerover = function(){
    homeDiv.style.backgroundColor = "greenyellow"
}
homeDiv.onpointerout = function(){
    homeDiv.style.backgroundColor = ""
}
