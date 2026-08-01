/*
==========================================
ToolHub TH.
Currency Converter v2.0
Version: 2.0.0
==========================================
*/

// ================================
// DOM Elements
// ================================

const amountInput = document.getElementById("amount");

const fromCurrency = document.getElementById("fromCurrency");

const toCurrency = document.getElementById("toCurrency");

const convertBtn = document.getElementById("convertBtn");

const swapBtn = document.getElementById("swapBtn");

const copyBtn = document.getElementById("copyBtn");

const resetBtn = document.getElementById("resetBtn");

const resultCard = document.getElementById("resultCard");

const resultAmount = document.getElementById("resultAmount");

const resultCurrency = document.getElementById("resultCurrency");

const resultText = document.getElementById("resultText");

const exchangeRate = document.getElementById("exchangeRate");

const lastUpdated = document.getElementById("lastUpdated");

// ================================
// API List (Fallback)
// ================================

const API_LIST = [

"https://open.er-api.com/v6/latest/"

];

// ================================
// Config
// ================================

const CONFIG = {

CACHE_KEY: "toolhub_currency_cache",

CACHE_TIME: 60 * 60 * 1000,

AUTO_REFRESH: 10 * 60 * 1000,

DEFAULT_FROM: "USD",

DEFAULT_TO: "THB",

DECIMAL: 2

};

// ================================
// State
// ================================

const state = {

apiIndex:0,

rates:null,

base:"USD",

lastUpdate:null,

loading:false

};

// ================================
// Currency Name
// ================================

const currencyNames={

USD:"🇺🇸 US Dollar",

THB:"🇹🇭 Thai Baht",

EUR:"🇪🇺 Euro",

GBP:"🇬🇧 British Pound",

JPY:"🇯🇵 Japanese Yen",

KRW:"🇰🇷 South Korean Won",

CNY:"🇨🇳 Chinese Yuan",

HKD:"🇭🇰 Hong Kong Dollar",

SGD:"🇸🇬 Singapore Dollar",

MYR:"🇲🇾 Malaysian Ringgit",

AUD:"🇦🇺 Australian Dollar",

CAD:"🇨🇦 Canadian Dollar",

CHF:"🇨🇭 Swiss Franc",

NZD:"🇳🇿 New Zealand Dollar",

INR:"🇮🇳 Indian Rupee",

VND:"🇻🇳 Vietnamese Dong",

PHP:"🇵🇭 Philippine Peso",

IDR:"🇮🇩 Indonesian Rupiah",

RUB:"🇷🇺 Russian Ruble",

AED:"🇦🇪 UAE Dirham",

SAR:"🇸🇦 Saudi Riyal"

};

// ================================
// Helper
// ================================

function formatNumber(number){

return Number(number).toLocaleString(

undefined,

{

minimumFractionDigits:CONFIG.DECIMAL,

maximumFractionDigits:CONFIG.DECIMAL

}

);

}

function showLoading(){

state.loading=true;

convertBtn.disabled=true;

convertBtn.textContent="กำลังโหลด...";

}

function hideLoading(){

state.loading=false;

convertBtn.disabled=false;

convertBtn.textContent="แปลงสกุลเงิน";

}

function showError(message){

alert(message);

console.error(message);

}

function saveCache(data){

const cache={

timestamp:Date.now(),

data:data

};

localStorage.setItem(

CONFIG.CACHE_KEY,

JSON.stringify(cache)

);

}

function loadCache(){

const raw=localStorage.getItem(

CONFIG.CACHE_KEY

);

if(!raw)return null;

try{

const cache=JSON.parse(raw);

const age=Date.now()-cache.timestamp;

if(age>CONFIG.CACHE_TIME){

return null;

}

return cache.data;

}

catch{

return null;

}

}

// ================================
// Fetch Exchange Rates
// ================================

async function fetchRates(base = CONFIG.DEFAULT_FROM){

showLoading();

for(let i=0;i<API_LIST.length;i++){

try{

const api=API_LIST[state.apiIndex];

const response=await fetch(api+base);

if(!response.ok){

throw new Error("API Error");

}

const data=await response.json();

if(data.result!=="success"){

throw new Error("Invalid Response");

}

state.base=base;
state.rates=data.rates;
state.lastUpdate=new Date();

saveCache({

base:base,

rates:data.rates,

lastUpdate:state.lastUpdate

});

hideLoading();

return true;

}

catch(error){

console.warn("Switch API...");

state.apiIndex++;

if(state.apiIndex>=API_LIST.length){

state.apiIndex=0;

}

}

}

hideLoading();

return false;

}

// ================================
// Load Cache
// ================================

function initializeCache(){

const cache=loadCache();

if(cache){

state.base=cache.base;

state.rates=cache.rates;

state.lastUpdate=new Date(cache.lastUpdate);

console.log("Loaded Cache");

return true;

}

return false;

}

// ================================
// Currency List
// ================================

function buildCurrencyList(){

if(!state.rates)return;

fromCurrency.innerHTML="";

toCurrency.innerHTML="";

const list=Object.keys(state.rates).sort();

list.forEach(code=>{

const option1=document.createElement("option");

option1.value=code;

option1.textContent=

`${code} - ${currencyNames[code]||code}`;

fromCurrency.appendChild(option1);

const option2=document.createElement("option");

option2.value=code;

option2.textContent=

`${code} - ${currencyNames[code]||code}`;

toCurrency.appendChild(option2);

});

fromCurrency.value=CONFIG.DEFAULT_FROM;

toCurrency.value=CONFIG.DEFAULT_TO;

}

// ================================
// Refresh Currency List
// ================================

async function initializeCurrencies(){

if(!initializeCache()){

const success=await fetchRates(CONFIG.DEFAULT_FROM);

if(!success){

showError("ไม่สามารถโหลดอัตราแลกเปลี่ยนได้");

return;

}

}

buildCurrencyList();

}

input.addEventListener("input",()=>{

const target=input.dataset.target==="from"

?fromCurrency

:toCurrency;

filterCurrency(target,input.value);

});

});

// ================================
// Update Last Updated
// ================================

function updateLastUpdated(){

if(!state.lastUpdate)return;

lastUpdated.textContent=

state.lastUpdate.toLocaleString(

"th-TH",

{

dateStyle:"medium",

timeStyle:"short"

}

);

}

// ================================
// Convert Engine
// ================================

async function convertCurrency(){

const amount=parseFloat(amountInput.value);

if(isNaN(amount)||amount<=0){

showError("กรุณากรอกจำนวนเงินให้ถูกต้อง");

amountInput.focus();

return;

}

const from=fromCurrency.value;

const to=toCurrency.value;

// โหลดเรทใหม่หากเปลี่ยน Base Currency

if(state.base!==from){

const success=await fetchRates(from);

if(!success){

showError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");

return;

}

}

const rate=state.rates[to];

if(!rate){

showError("ไม่พบอัตราแลกเปลี่ยน");

return;

}

const total=amount*rate;

resultAmount.textContent=formatNumber(total);

resultCurrency.textContent=to;

resultText.textContent=

`${formatNumber(amount)} ${from} = ${formatNumber(total)} ${to}`;

exchangeRate.textContent=

`1 ${from} = ${formatNumber(rate)} ${to}`;

updateLastUpdated();

resultCard.style.display="block";

resultCard.scrollIntoView({

behavior:"smooth",

block:"nearest"

});

}

// ================================
// Swap Currency
// ================================

function swapCurrencies(){

const temp=fromCurrency.value;

fromCurrency.value=toCurrency.value;

toCurrency.value=temp;

convertCurrency();

}

swapBtn.addEventListener(

"click",

swapCurrencies

);

// ================================
// Convert Button
// ================================

convertBtn.addEventListener(

"click",

convertCurrency

);

// ================================
// Auto Convert
// ================================

amountInput.addEventListener(

"input",

()=>{

if(amountInput.value.trim()!==""){

convertCurrency();

}

}

);

fromCurrency.addEventListener(

"change",

convertCurrency

);

toCurrency.addEventListener(

"change",

convertCurrency

);

// ================================
// Press Enter
// ================================

amountInput.addEventListener(

"keydown",

e=>{

if(e.key==="Enter"){

convertCurrency();

}

}

);

// ================================
// Copy Result
// ================================

copyBtn.addEventListener(

"click",

async()=>{

try{

await navigator.clipboard.writeText(

resultText.textContent

);

const old=copyBtn.textContent;

copyBtn.textContent="✅ คัดลอกแล้ว";

setTimeout(()=>{

copyBtn.textContent=old;

},1800);

}

catch{

showError("ไม่สามารถคัดลอกได้");

}

}

);

// ================================
// Reset
// ================================

function resetConverter(){

amountInput.value=1;

fromCurrency.value=CONFIG.DEFAULT_FROM;

toCurrency.value=CONFIG.DEFAULT_TO;

resultCard.style.display="none";

amountInput.focus();

}

resetBtn.addEventListener(

"click",

resetConverter

);

// ================================
// Prevent Invalid Input
// ================================

amountInput.addEventListener(

"keypress",

e=>{

const char=String.fromCharCode(e.which);

if(!/[0-9.]/.test(char)){

e.preventDefault();

}

}

);

// ================================
// Select All
// ================================

amountInput.addEventListener(

"focus",

()=>{

amountInput.select();

}

);

// ================================
// Fade Result
// ================================

function showResult(){

resultCard.style.opacity="0";

resultCard.style.display="block";

requestAnimationFrame(()=>{

resultCard.style.transition=".3s";

resultCard.style.opacity="1";

});

}

// ================================
// Retry Convert
// ================================

async function retryConvert(maxRetry = 3){

for(let i=1;i<=maxRetry;i++){

try{

await convertCurrency();

return true;

}catch(error){

console.warn(`Retry ${i}/${maxRetry}`);

}

}

showError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");

return false;

}

// ================================
// Auto Refresh
// ================================

setInterval(async()=>{

if(document.visibilityState==="visible"){

if(fromCurrency.value){

await fetchRates(fromCurrency.value);

convertCurrency();

}

}

},CONFIG.AUTO_REFRESH);

// ================================
// Online / Offline
// ================================

window.addEventListener("offline",()=>{

convertBtn.disabled=true;

convertBtn.textContent="ไม่มีอินเทอร์เน็ต";

});

window.addEventListener("online",()=>{

convertBtn.disabled=false;

convertBtn.textContent="แปลงสกุลเงิน";

retryConvert();

});

// ================================
// Favorite Currency
// ================================

const favoritePairs=[

["USD","THB"],

["THB","USD"],

["EUR","THB"],

["JPY","THB"],

["GBP","THB"],

["CNY","THB"]

];

function createFavoriteButtons(){

const container=document.getElementById("favoriteCurrencies");

if(!container)return;

favoritePairs.forEach(pair=>{

const button=document.createElement("button");

button.className="favorite-btn";

button.textContent=`${pair[0]} → ${pair[1]}`;

button.onclick=()=>{

fromCurrency.value=pair[0];

toCurrency.value=pair[1];

convertCurrency();

};

container.appendChild(button);

});

}

// ================================
// Popular Currency
// ================================

document.querySelectorAll(".popular-item").forEach(item=>{

item.addEventListener("click",()=>{

const pair=item.dataset.pair;

if(!pair)return;

const [from,to]=pair.split("-");

fromCurrency.value=from;

toCurrency.value=to;

convertCurrency();

});

});

// ================================
// Save Last Pair
// ================================

function saveLastPair(){

localStorage.setItem(

"toolhub_currency_pair",

JSON.stringify({

from:fromCurrency.value,

to:toCurrency.value

})

);

}

function loadLastPair(){

const data=localStorage.getItem(

"toolhub_currency_pair"

);

if(!data)return;

try{

const pair=JSON.parse(data);

fromCurrency.value=pair.from;

toCurrency.value=pair.to;

}catch{}

}

fromCurrency.addEventListener("change",saveLastPair);

toCurrency.addEventListener("change",saveLastPair);

// ================================
// Loading Animation
// ================================

function showSpinner(){

document.body.classList.add("loading");

}

function hideSpinner(){

document.body.classList.remove("loading");

}

// ================================
// Initialize
// ================================

async function initialize(){

showSpinner();

await initializeCurrencies();

loadLastPair();

createFavoriteButtons();

hideSpinner();

convertCurrency();

}

// ================================
// Start
// ================================

window.addEventListener("load",initialize);

// ================================
// ToolHub TH
// Currency Converter
// Version 2.0
// End of File
// ================================
