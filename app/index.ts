import axios from 'axios'
import { BrowserWindowProxy, ipcRenderer, webFrame, desktopCapturer, shell, clipboard } from 'electron'
import { IpcRendererEvent } from 'electron/main'
import ConversionRatesInterface from './ConversionRatesInterface'
import conversionRatesKeys from './conversionRatesKeys'
const apiKey = "d0ef71289ff8ca5bc01d1b94"
let currencyCode: string | null = null
let ratesResult: ConversionRatesInterface | null = null
let ratesResultFinalString: string | null = null
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
const processDiv: HTMLDivElement = document.getElementById("processDiv") as HTMLDivElement
const processImg: HTMLImageElement = document.getElementById("process") as HTMLImageElement
const crashDiv: HTMLDivElement = document.getElementById("crashDiv") as HTMLDivElement
const crashImg: HTMLImageElement = document.getElementById("crash") as HTMLImageElement
const clipboardDiv: HTMLDivElement = document.getElementById("clipboardDiv") as HTMLDivElement
const clipboardImg: HTMLImageElement = document.getElementById("clipboard") as HTMLImageElement
let gabTvImg: HTMLImageElement = document.getElementById("gabTV") as HTMLImageElement

let isOnline: boolean = navigator.onLine
window.addEventListener("online", (_event: Event) => {
    isOnline = true
    alert("You are now ONLINE !")
})
window.addEventListener("offline", (_event: Event) => {
    isOnline = false
    alert("You are now OFFLINE !\n\nThis app can't work properly OFFLINE.\n\nPlease turn on your network in order to use this app !")
})

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
    if(isOnline){
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
    } else{
        alert("You are currently OFFLINE !\n\nThis app can't work properly OFFLINE.\n\nPlease turn on your network in order to use this app !'")
    }
}
function setTextAreaResult(timeLastUpdate: string | null, conversion_rates: ConversionRatesInterface | null){
    if(timeLastUpdate && conversion_rates){
        ratesResultFinalString = "Updated: "+timeLastUpdate+"\n\n"
        const keyArray: string[] = Object.keys(conversion_rates)
        keyArray.forEach(key => {
            ratesResultFinalString += "1 "+currencyCode+" = "+conversion_rates[key as keyof ConversionRatesInterface]+" "+key+"\n"
        })
        resultTextArea.rows = 15
        resultTextArea.value = ratesResultFinalString
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
    ratesResultFinalString = null
    setTextAreaResult(lastUpdated, ratesResult)    
    clearClipboard()
}
whiteThemeImg.onclick = function(){
    setTheme("whiteTheme")
}
ipcRenderer.on('whiteThemeFromMain', () => {
    whiteThemeImg.click()
})
blackThemeImg.onclick = function(){
    setTheme("blackTheme")
}
ipcRenderer.on('blackThemeFromMain', () => {
    blackThemeImg.click()
})
printImg.onclick = function() {
    if(lastUpdated && currencyCode && ratesResult){
        ipcRenderer.send("printFromIndex", {lastUpdated, currencyCode, ratesResult})
    } else{
        alert("First select a currency and get the rates, in order to print the result !")
    }
}
ipcRenderer.on("printFromMain", () => {
    printImg.click()
})
printToPDFImg.onclick = function() {
    if(lastUpdated && currencyCode && ratesResult){
        ipcRenderer.send("printToPDFFromIndex", {lastUpdated, currencyCode, ratesResult})
    } else{
        alert("First select a currency and get the rates, in order to print the result to a pdf file !")
    }
}
ipcRenderer.on("printToPDFFromMain", () => {
    printToPDFImg.click()
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
        websiteWindow = window.open("https://danielpm1982.com/") as unknown as BrowserWindowProxy
        // const stringToEval = "const h3NewElement = document.createElement('h3'); h3NewElement.textContent = '(Referred from Exchange Rate Client App)'; document.getElementById('headerMainPage').appendChild(h3NewElement);"
        // websiteWindow.eval(stringToEval)    
        websiteImg.title = "close website Window"
        websiteImg.alt = "close website Window"
        websiteImg.className = "unclickable"
        setTimeout(() => {
            websiteImg.className = ""
        }, 1000)
    } else{
        closeWebSiteWindowAndResetWebSiteImg()
    }
}
function closeWebSiteWindowAndResetWebSiteImg(){
    websiteWindow?.close()
    websiteWindow = null
    websiteImg.title = "go to danielpm1982.com"
    websiteImg.alt = "go to danielpm1982.com"
    websiteImg.className = "unclickable"
    setTimeout(() => {
        websiteImg.className = ""
    }, 1000)
}
ipcRenderer.on("closeWebSiteWindowAndResetWebSiteImg", () => {
    closeWebSiteWindowAndResetWebSiteImg()
})
zoomInImg.onclick = function(){
    webFrame.setZoomFactor(webFrame.getZoomFactor()*1.1)
}
zoomOutImg.onclick = function(){
    webFrame.setZoomFactor(webFrame.getZoomFactor()/1.1)
}
screenCaptureImg.onclick = function(){
    desktopCapturer.getSources({types: ['screen'], thumbnailSize: {width: 1920, height: 1080}})
    .then(sources => {
        const fileBuffer = sources[0].thumbnail.toPNG()
        const filePath = ipcRenderer.sendSync("saveScreenCapture", fileBuffer)
        if(filePath){
            // window.open("file://"+filePath)
            shell.showItemInFolder(filePath)
            shell.openPath(filePath).catch(error => {
                alert("Error opening screenCapture file at: "+filePath+".\n\n"+error)
            })
        }
    })
    .catch(error => {
        alert(error)
    })
}
ipcRenderer.on('screenCaptureFromMain', () => {
    screenCaptureImg.click()
})
processImg.onclick = async function(){
    let processMemoryInfoString: string = ""
    await process.getProcessMemoryInfo().then(memoryInfo => processMemoryInfoString = "private: "+memoryInfo.private+" residentSet: "+memoryInfo.residentSet+" shared: "+memoryInfo.shared)+"\n"+
    alert(
        "PROCESS AND SYSTEM INFO:\n\n"+
        "CPU usage by the system: "+process.cpuUsage().system+"\n"+
        "CPU usage by the user: "+process.cpuUsage().user+"\n"+
        "Execution folder (cwd):\n"+process.cwd()+"\n"+
        "IPV6: "+process.features.ipv6+"\n"+
        "TLS: "+process.features.tls+"\n"+
        "Blink memory allocated: "+process.getBlinkMemoryInfo().allocated+"\n"+
        "Blink memory total: "+process.getBlinkMemoryInfo().total+"\n"+
        "CPU usage idleWakeupsPerSecond: "+process.getCPUUsage().idleWakeupsPerSecond+"\n"+
        "CPU usage percentage (%): "+process.getCPUUsage().percentCPUUsage+"\n"+
        "Creation time:\n"+new Date(process.getCreationTime()!)+"\n"+
        "Heap does zap garbage: "+process.getHeapStatistics().doesZapGarbage+"\n"+
        "Heap size limit: "+process.getHeapStatistics().heapSizeLimit+"\n"+
        "Heap malloced memory: "+process.getHeapStatistics().mallocedMemory+"\n"+
        "Heap peak malloced memory: "+process.getHeapStatistics().peakMallocedMemory+"\n"+
        "Heap total available size: "+process.getHeapStatistics().totalAvailableSize+"\n"+
        "Heap total size: "+process.getHeapStatistics().totalHeapSize+"\n"+
        "Heap total size executable: "+process.getHeapStatistics().totalHeapSizeExecutable+"\n"+
        "Heap total physical size: "+process.getHeapStatistics().totalPhysicalSize+"\n"+
        "Heap used size: "+process.getHeapStatistics().usedHeapSize+"\n"+
        "Process memory info:\n"+processMemoryInfoString+"\n"+
        "System memory info free: "+process.getSystemMemoryInfo().free+"\n"+
        "System memory info swap free: "+process.getSystemMemoryInfo().swapFree+"\n"+
        "System memory info swap total: "+process.getSystemMemoryInfo().swapTotal+"\n"+
        "System memory info total: "+process.getSystemMemoryInfo().total+"\n"+
        "System version: "+process.getSystemVersion()+"\n"+
        "Memory usage external: "+process.memoryUsage().external+"\n"+
        "Memory usage heapTotal: "+process.memoryUsage().heapTotal+"\n"+
        "Memory usage heapUsed: "+process.memoryUsage().heapUsed+"\n"+
        "Memory usage rss: "+process.memoryUsage().rss+"\n"+
        "Process title: "+process.title+"\n"+
        "Process type: "+process.type+"\n"+
        "Process uptime: "+process.uptime()+"\n"+
        "Process versions ares: "+process.versions.ares+"\n"+
        "Process versions chrome: "+process.versions.chrome+"\n"+
        "Process versions electron: "+process.versions.electron+"\n"+
        "Process versions http_parser: "+process.versions.http_parser+"\n"+
        "Process versions modules: "+process.versions.modules+"\n"+
        "Process versions node: "+process.versions.node+"\n"+
        "Process versions openssl: "+process.versions.openssl+"\n"+
        "Process versions uv: "+process.versions.uv+"\n"+
        "Process versions v8: "+process.versions.v8+"\n"+
        "Process versions zlib: "+process.versions.zlib+"\n\n"+
        "* memory units in Kilobytes (KB)"
    )
}
ipcRenderer.on('processFromMain', () => {
    processImg.click()
})
crashImg.onclick = function(){
    process.crash()
}
clipboardImg.onclick = function(){
    if(ratesResultFinalString){
        clipboard.writeText(ratesResultFinalString)
    } else{
        alert("First select a currency and get the rates, in order to copy the result to the clipboard !")
    }
}
ipcRenderer.on('sendRateResultsToClipboardFromMain', () => {
    clipboardImg.click()
})
function clearClipboard(){
    clipboard.clear()
}
ipcRenderer.on('clearClipboardFromMain', () => {
    clearClipboard()
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
processDiv.onpointerover = function(){
    processDiv.style.backgroundColor = "greenyellow"
}
processDiv.onpointerout = function(){
    processDiv.style.backgroundColor = ""
}
crashDiv.onpointerover = function(){
    crashDiv.style.backgroundColor = "greenyellow"
}
crashDiv.onpointerout = function(){
    crashDiv.style.backgroundColor = ""
}
clipboardDiv.onpointerover = function(){
    clipboardDiv.style.backgroundColor = "greenyellow"
}
clipboardDiv.onpointerout = function(){
    clipboardDiv.style.backgroundColor = ""
}
ipcRenderer.on("updateGabTVImg", (_event: IpcRendererEvent, srcPath: string) => {
    const temp: HTMLImageElement = document.createElement("img")
    if(isOnline){
        temp.src = srcPath
    } else{
        temp.src = "img/gabTV.png"
    }
    temp.alt = "gabTV"
    temp.title = "go to Gab TV"
    temp.style.width = "100%"
    temp.style.height = "25em"
    gabTvImg.parentElement!.replaceChild(temp, gabTvImg)
    gabTvImg = temp
})
document.addEventListener("DOMContentLoaded", () => {
    conversionRatesKeys.forEach(key => {
        const option = document.createElement("OPTION") as HTMLOptionElement
        option.text = key
        currencyCodeSelect.options.add(option)
    })
    setTheme("blackTheme") // dark theme as default, can be toggled to light theme by the user
    if(!isOnline){
        alert("You are currently OFFLINE !\n\nThis app can't work properly OFFLINE.\n\nPlease turn on your network in order to use this app !'")
    }
})
