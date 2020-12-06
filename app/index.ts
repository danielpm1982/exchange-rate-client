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
getRatesButton.onclick = function() {
    buttonAction()
}
clearButton.onclick = function() {
    setTextAreaResult('', '')
    currencyCode=''
    currencyCodeSelect.selectedIndex = 0
}
document.addEventListener("DOMContentLoaded", () => {
    conversionRatesKeys.forEach(key => {
        const option = document.createElement("OPTION") as HTMLOptionElement
        option.text = key
        currencyCodeSelect.options.add(option)
    })
})
