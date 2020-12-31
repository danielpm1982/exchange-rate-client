import axios from 'axios'
import { BrowserWindowProxy, ipcRenderer, webFrame, desktopCapturer } from 'electron'
import { IpcRendererEvent } from 'electron/main'
import ConversionRatesInterface from './ConversionRatesInterface'
import conversionRatesKeys from './conversionRatesKeys'
const apiKey = "d0ef71289ff8ca5bc01d1b94"
let currencyCode: string | null = null
let ratesResult: ConversionRatesInterface | null = null
let lastUpdated: string | null = null
const currencyCodeSelect:HTMLSelectElement = document.getElementById("currencyCodeSelect")! as HTMLSelectElement
const getRatesButton:HTMLButtonElement = document.getElementById("getRatesButton") as HTMLButtonElement
const clearButton:HTMLButtonElement = document.getElementById("clearButton") as HTMLButtonElement
const resultTextArea:HTMLTextAreaElement = document.getElementById("resultTextArea") as HTMLTextAreaElement
const whiteThemeImg:HTMLImageElement = document.getElementById("whiteTheme") as HTMLImageElement
const blackThemeImg:HTMLImageElement = document.getElementById("blackTheme") as HTMLImageElement
const printImg:HTMLImageElement = document.getElementById("print") as HTMLImageElement
const printToPDFImg:HTMLImageElement = document.getElementById("printToPDF") as HTMLImageElement
const body: HTMLBodyElement = document.getElementsByTagName("body")[0] as HTMLBodyElement
const whiteThemeDiv: HTMLDivElement = document.getElementById("whiteThemeDiv") as HTMLDivElement
const blackThemeDiv: HTMLDivElement = document.getElementById("blackThemeDiv") as HTMLDivElement
const printDiv: HTMLDivElement = document.getElementById("printDiv") as HTMLDivElement
const printToPDFDiv: HTMLDivElement = document.getElementById("printToPDFDiv") as HTMLDivElement
const leftSpan: HTMLSpanElement = document.getElementsByClassName("leftSpan")[0] as HTMLSpanElement
const anchorElementArray: HTMLCollectionOf<HTMLAnchorElement> = document.getElementsByTagName("a") as HTMLCollectionOf<HTMLAnchorElement>
const logoExchangeRateAPIDiv: HTMLDivElement = document.getElementById("logoExchangeRateAPIDiv") as HTMLDivElement
const downloadLogoAnchor: HTMLAnchorElement = document.getElementById("downloadLogo") as HTMLAnchorElement
const websiteDiv: HTMLDivElement = document.getElementById("websiteDiv") as HTMLDivElement
const websiteImg: HTMLImageElement = document.getElementById("website") as HTMLImageElement
let websiteWindow: BrowserWindowProxy | null
const zoomInDiv: HTMLDivElement = document.getElementById("zoomInDiv") as HTMLDivElement
const zoomOutDiv: HTMLDivElement = document.getElementById("zoomOutDiv") as HTMLDivElement
const zoomInImg: HTMLImageElement = document.getElementById("zoomIn") as HTMLImageElement
const zoomOutImg: HTMLImageElement = document.getElementById("zoomOut") as HTMLImageElement
const screenCaptureDiv: HTMLDivElement = document.getElementById("screenCaptureDiv") as HTMLDivElement
const screenCaptureImg: HTMLImageElement = document.getElementById("screenCapture") as HTMLImageElement

function setCurrencyCode(): boolean{
    const inputValue = currencyCodeSelect.value
    const inputIndex = currencyCodeSelect.selectedIndex
    if(inputValue && inputIndex != 0){
        currencyCode = inputValue
        return true
    } else{
        alert('Invalid selection ! Please select a valid currency for getting its exchange rates !')
        return false
    }
}
function getCurrencyExchangeRates(currencyCode:string): void{
    axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${currencyCode}`)
    .then(response => {
        if(response.status == 200){
            console.log(response)
            lastUpdated = response.data.time_last_update_utc
            ratesResult = response.data.conversion_rates
            setTextAreaResult( lastUpdated, ratesResult )
        }
    })
    .catch(error => {
        alert('Can\'t show result ! Please, try again later !\n\n'+error)
    })
}
function setTextAreaResult(timeLastUpdate: string | null, conversion_rates: ConversionRatesInterface | null){
    if(timeLastUpdate && conversion_rates){
        let result: string = "Updated: "+timeLastUpdate+"\n\n"
        const keyArray: string[] = Object.keys(conversion_rates)
        keyArray.forEach(key => {
            result += "1 "+currencyCode+" = "+conversion_rates[key as keyof ConversionRatesInterface]+" "+key+"\n"
        })
        resultTextArea.rows = 15
        resultTextArea.value = result
    } else{
        resultTextArea.rows = 2
        resultTextArea.value = ''
    }
}
function buttonAction(): void{
    if(setCurrencyCode()){
        getCurrencyExchangeRates(currencyCode!)
    }
}
function setTheme(themeType: string){
    if(themeType === "whiteTheme"){
        body.style.backgroundColor = "white"
        body.style.color = "black"
        leftSpan.style.color = "green"
        leftSpan.style.fontWeight = "bold"
        Array.from(anchorElementArray).forEach((anchor: HTMLAnchorElement) => {
            anchor.style.color = "black"
        })
        whiteThemeDiv.style.display = "none"
        blackThemeDiv.style.display = "table-cell"
    } else{
        body.style.backgroundColor = "black"
        body.style.color = "white"
        leftSpan.style.color = "greenyellow"
        Array.from(anchorElementArray).forEach((anchor: HTMLAnchorElement) => {
            anchor.style.color = "white"
        })
        blackThemeDiv.style.display = "none"
        whiteThemeDiv.style.display = "table-cell"
    }
}
getRatesButton.onclick = function() {
    buttonAction()
}
clearButton.onclick = function() {
    currencyCodeSelect.selectedIndex = 0
    currencyCode = null
    lastUpdated = null
    ratesResult = null
    setTextAreaResult(lastUpdated, ratesResult)    
}
whiteThemeImg.onclick = function(){
    setTheme("whiteTheme")
}
ipcRenderer.on('whiteThemeFromMain', () => {
    setTheme("whiteTheme")
})
blackThemeImg.onclick = function(){
    setTheme("blackTheme")
}
ipcRenderer.on('blackThemeFromMain', () => {
    setTheme("blackTheme")
})
printImg.onclick = function() {
    if(lastUpdated && currencyCode && ratesResult){
        ipcRenderer.send("printFromIndex", {lastUpdated, currencyCode, ratesResult})
    } else{
        alert("First select a currency and get the rates, in order to print the result !")
    }
}
ipcRenderer.on("printFromMain", () => {
    if(lastUpdated && currencyCode && ratesResult){
        ipcRenderer.send("printFromIndex", {lastUpdated, currencyCode, ratesResult})
    } else{
        alert("First select a currency and get the rates, in order to print the result !")
    }
})
printToPDFImg.onclick = function() {
    if(lastUpdated && currencyCode && ratesResult){
        ipcRenderer.send("printToPDFFromIndex", {lastUpdated, currencyCode, ratesResult})
    } else{
        alert("First select a currency and get the rates, in order to print the result to a pdf file !")
    }
}
ipcRenderer.on("printToPDFFromMain", () => {
    if(lastUpdated && currencyCode && ratesResult){
        ipcRenderer.send("printToPDFFromIndex", {lastUpdated, currencyCode, ratesResult})
    } else{
        alert("First select a currency and get the rates, in order to print the result to a pdf file !")
    }
})
ipcRenderer.on("downloadLogoFromMain", () => {
    downloadLogoAnchor.click()
})
ipcRenderer.on("rateResultStatusRequestFromMain", (e: IpcRendererEvent) => {
    if(resultTextArea?.value != ''){
        e.sender.send("rateResultStatusResponseFromIndex", true)
    } else{
        e.sender.send("rateResultStatusResponseFromIndex", false)
    }
})
websiteImg.onclick = function(){
    if(!websiteWindow){
        websiteWindow = window.open("http://danielpm1982.com") as unknown as BrowserWindowProxy
        const stringToEval = "const h1NewElement = document.createElement('h1'); h1NewElement.textContent = '(Referred from'; const h1NewElement2 = document.createElement('h1'); h1NewElement2.textContent = 'Exchange Rate Client App)'; document.getElementById('domainText').parentElement.append(document.createElement('br')); document.getElementById('domainText').parentElement.appendChild(h1NewElement);document.getElementById('domainText').parentElement.append(document.createElement('br')); document.getElementById('domainText').parentElement.appendChild(h1NewElement2);"
        websiteWindow.eval(stringToEval)
        websiteImg.title = "close website Window"
        websiteImg.alt = "close website Window"
        websiteImg.className = "unclickable"
        setTimeout(() => {
            websiteImg.className = ""
        }, 1000)
    } else{
        websiteWindow.close()
        websiteWindow = null
        websiteImg.title = "go to danielpm1982.com"
        websiteImg.alt = "go to danielpm1982.com"
        websiteImg.className = "unclickable"
        setTimeout(() => {
            websiteImg.className = ""
        }, 1000)
    }
}
zoomInImg.onclick = function(){
    webFrame.setZoomFactor(webFrame.getZoomFactor()*1.1)
}
zoomOutImg.onclick = function(){
    webFrame.setZoomFactor(webFrame.getZoomFactor()/1.1)
}
screenCaptureImg.onclick = function(){
    desktopCapturer.getSources({types: ['screen'], thumbnailSize: {width: 1920, height: 1080}})
    .then(async sources => {
        const fileBuffer = sources[0].thumbnail.toPNG()
        ipcRenderer.send("saveScreenCapture", fileBuffer)
    })
    .catch(error => {
        alert(error)
    })
}
ipcRenderer.on('screenCaptureFromMain', () => {
    screenCaptureImg.click()
})
whiteThemeDiv.onpointerover = function(){
    whiteThemeDiv.style.backgroundColor = "greenyellow"
}
whiteThemeDiv.onpointerout = function(){
    whiteThemeDiv.style.backgroundColor = ""
}
blackThemeDiv.onpointerover = function(){
    blackThemeDiv.style.backgroundColor = "greenyellow"
}
blackThemeDiv.onpointerout = function(){
    blackThemeDiv.style.backgroundColor = ""
}
logoExchangeRateAPIDiv.onpointerover = function(){
    logoExchangeRateAPIDiv.style.backgroundColor = "greenyellow"
}
logoExchangeRateAPIDiv.onpointerout = function(){
    logoExchangeRateAPIDiv.style.backgroundColor = ""
}
printDiv.onpointerover = function(){
    printDiv.style.backgroundColor = "greenyellow"
}
printDiv.onpointerout = function(){
    printDiv.style.backgroundColor = ""
}
printToPDFDiv.onpointerover = function(){
    printToPDFDiv.style.backgroundColor = "greenyellow"
}
printToPDFDiv.onpointerout = function(){
    printToPDFDiv.style.backgroundColor = ""
}
websiteDiv.onpointerover = function(){
    websiteDiv.style.backgroundColor = "greenyellow"
}
websiteDiv.onpointerout = function(){
    websiteDiv.style.backgroundColor = ""
}
zoomInDiv.onpointerover = function(){
    zoomInDiv.style.backgroundColor = "greenyellow"
}
zoomInDiv.onpointerout = function(){
    zoomInDiv.style.backgroundColor = ""
}
zoomOutDiv.onpointerover = function(){
    zoomOutDiv.style.backgroundColor = "greenyellow"
}
zoomOutDiv.onpointerout = function(){
    zoomOutDiv.style.backgroundColor = ""
}
screenCaptureDiv.onpointerover = function(){
    screenCaptureDiv.style.backgroundColor = "greenyellow"
}
screenCaptureDiv.onpointerout = function(){
    screenCaptureDiv.style.backgroundColor = ""
}
document.addEventListener("DOMContentLoaded", () => {
    conversionRatesKeys.forEach(key => {
        const option = document.createElement("OPTION") as HTMLOptionElement
        option.text = key
        currencyCodeSelect.options.add(option)
    })
    setTheme("blackTheme") // dark theme as default, can be toggled to light theme by the user
})
