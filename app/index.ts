import axios from 'axios'
import { ipcRenderer } from 'electron'
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
        blackThemeDiv.style.display = "inline-block"
    } else{
        body.style.backgroundColor = "black"
        body.style.color = "white"
        leftSpan.style.color = "greenyellow"
        Array.from(anchorElementArray).forEach((anchor: HTMLAnchorElement) => {
            anchor.style.color = "white"
        })
        blackThemeDiv.style.display = "none"
        whiteThemeDiv.style.display = "inline-block"
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
document.addEventListener("DOMContentLoaded", () => {
    conversionRatesKeys.forEach(key => {
        const option = document.createElement("OPTION") as HTMLOptionElement
        option.text = key
        currencyCodeSelect.options.add(option)
    })
    setTheme("blackTheme") // dark theme as default, can be toggled to light theme by the user
})
