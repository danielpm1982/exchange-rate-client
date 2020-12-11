import axios from 'axios'
import ConversionRatesInterface from './ConversionRatesInterface'
import conversionRatesKeys from './conversionRatesKeys'
const apiKey = "d0ef71289ff8ca5bc01d1b94"
let currencyCode = ''
// const currencyCodeTextInput:HTMLInputElement = document.getElementById("currencyCodeTextInput")! as HTMLInputElement
const currencyCodeSelect:HTMLSelectElement = document.getElementById("currencyCodeSelect")! as HTMLSelectElement
const getRatesButton:HTMLButtonElement = document.getElementById("getRatesButton") as HTMLButtonElement
const clearButton:HTMLButtonElement = document.getElementById("clearButton") as HTMLButtonElement
const resultTextArea:HTMLTextAreaElement = document.getElementById("resultTextArea") as HTMLTextAreaElement
const whiteThemeImg:HTMLImageElement = document.getElementById("whiteTheme") as HTMLImageElement
const blackThemeImg:HTMLImageElement = document.getElementById("blackTheme") as HTMLImageElement
const body: HTMLBodyElement = document.getElementsByTagName("body")[0] as HTMLBodyElement
const whiteThemeDiv: HTMLDivElement = document.getElementById("whiteThemeDiv") as HTMLDivElement
const blackThemeDiv: HTMLDivElement = document.getElementById("blackThemeDiv") as HTMLDivElement
const leftSpan: HTMLSpanElement = document.getElementsByClassName("leftSpan")[0] as HTMLSpanElement
const anchorElementArray: HTMLCollectionOf<HTMLAnchorElement> = document.getElementsByTagName("a") as HTMLCollectionOf<HTMLAnchorElement>
function getCurrencyExchangeRates(currencyCode:string): void{
    axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${currencyCode}`)
    .then(response => {
        if(response.status == 200){
            console.log(response)
            setTextAreaResult(response.data.time_last_update_utc as string, response.data.conversion_rates as ConversionRatesInterface)
        }
    })
    .catch(error => {
        alert('Can\'t show result ! Please, try again later !\n\n'+error)
    })
}
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
function setTextAreaResult(timeLastUpdate: string, conversion_rates: ConversionRatesInterface | ''){
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
        getCurrencyExchangeRates(currencyCode)
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
    setTextAreaResult('', '')
    currencyCode=''
    currencyCodeSelect.selectedIndex = 0
}
whiteThemeImg.onclick = function(){
    setTheme("whiteTheme")
}
blackThemeImg.onclick = function(){
    setTheme("blackTheme")
}
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
document.addEventListener("DOMContentLoaded", () => {
    conversionRatesKeys.forEach(key => {
        const option = document.createElement("OPTION") as HTMLOptionElement
        option.text = key
        currencyCodeSelect.options.add(option)
    })
    setTheme("blackTheme")
})
