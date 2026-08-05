"use strict";

/* ==========================================
   ToolHub TH
   Currency Converter v3.1
========================================== */

/* ===========================
   API
=========================== */

const API_URL = "https://open.er-api.com/v6/latest/";
const CACHE_TIME = 60 * 60 * 1000;

/* ===========================
   DOM
=========================== */

const amountInput = document.getElementById("amount");

const fromCurrency = document.getElementById("fromCurrency");

const toCurrency = document.getElementById("toCurrency");

const convertBtn = document.getElementById("convertBtn");

const swapBtn = document.getElementById("swapBtn");

const copyBtn = document.getElementById("copyBtn");

const resetBtn = document.getElementById("resetBtn");

/* ===========================
   Result
=========================== */

const resultCard = document.getElementById("resultCard");

const resultAmount = document.getElementById("resultAmount");

const resultCurrency = document.getElementById("resultCurrency");

const resultText = document.getElementById("resultText");

const exchangeRate = document.getElementById("exchangeRate");

const lastUpdated = document.getElementById("lastUpdated");

/* ===========================
   Currency Names
=========================== */

const currencyNames = {

THB:"🇹🇭 Thai Baht",

USD:"🇺🇸 US Dollar",

EUR:"🇪🇺 Euro",

GBP:"🇬🇧 British Pound",

JPY:"🇯🇵 Japanese Yen",

CNY:"🇨🇳 Chinese Yuan",

KRW:"🇰🇷 Korean Won",

SGD:"🇸🇬 Singapore Dollar",

HKD:"🇭🇰 Hong Kong Dollar",

AUD:"🇦🇺 Australian Dollar",

CAD:"🇨🇦 Canadian Dollar",

CHF:"🇨🇭 Swiss Franc",

MYR:"🇲🇾 Malaysian Ringgit",

VND:"🇻🇳 Vietnamese Dong",

INR:"🇮🇳 Indian Rupee",

PHP:"🇵🇭 Philippine Peso",

IDR:"🇮🇩 Indonesian Rupiah",

AED:"🇦🇪 UAE Dirham",

SAR:"🇸🇦 Saudi Riyal",

NZD:"🇳🇿 New Zealand Dollar"

};

/* ===========================
   Global State
=========================== */

let exchangeRates = {};

let currentBase = "THB";

/* ===========================
   Loading
=========================== */

function setLoading(loading){

    if(!convertBtn) return;

    if(loading){

        convertBtn.disabled = true;
        convertBtn.textContent = "กำลังโหลด...";

    }else{

        convertBtn.disabled = false;
        convertBtn.textContent = "แปลงสกุลเงิน";

    }

}

/* ===========================
   Cache
=========================== */

function getCacheKey(base){

    return `toolhub_currency_${base}`;

}

function saveCache(base,rates,time){

    const data={

        timestamp:Date.now(),

        rates:rates,

        updateTime:time

    };

    localStorage.setItem(

        getCacheKey(base),

        JSON.stringify(data)

    );

}

function loadCache(base){

    const raw=

    localStorage.getItem(

        getCacheKey(base)

    );

    if(!raw) return null;

    try{

        const cache=

        JSON.parse(raw);

        const age=

        Date.now()-cache.timestamp;

        if(age<CACHE_TIME){

            return cache;

        }

    }catch(error){

        console.error(error);

    }

    return null;

}

/* ===========================
   API
=========================== */

async function fetchRates(base){

    currentBase=base;

    const cache=

    loadCache(base);

    if(cache){

        exchangeRates=

        cache.rates;

        if(lastUpdated){

            lastUpdated.textContent=

            new Date(

                cache.updateTime

            ).toLocaleString("th-TH");

        }

        return true;

    }

    setLoading(true);

    try{

        const response=

        await fetch(

            API_URL+base

        );

        if(!response.ok){

            throw new Error(

                "HTTP Error"

            );

        }

        const data=

        await response.json();

        if(data.result!=="success"){

            throw new Error(

                "API Error"

            );

        }

        exchangeRates=

        data.rates;

        saveCache(

            base,

            data.rates,

            data.time_last_update_utc

        );

        if(lastUpdated){

            lastUpdated.textContent=

            new Date(

                data.time_last_update_utc

            ).toLocaleString("th-TH");

        }

        return true;

    }catch(error){

        console.error(error);

        alert(

            "ไม่สามารถโหลดอัตราแลกเปลี่ยนได้\nกรุณาลองใหม่อีกครั้ง"

        );

        return false;

    }finally{

        setLoading(false);

    }

}

/* ===========================
   Convert Currency
=========================== */

async function convertCurrency(){

    const amount =
    parseFloat(amountInput.value);

    if(isNaN(amount) || amount <= 0){

        alert("กรุณากรอกจำนวนเงิน");

        amountInput.focus();

        return;

    }

    const from = fromCurrency.value;

    const to = toCurrency.value;

    if(from === to){

        resultCard.style.display = "block";

        resultAmount.textContent =
        amount.toLocaleString("en-US",{

            minimumFractionDigits:2,

            maximumFractionDigits:2

        });

        resultCurrency.textContent = to;

        resultText.textContent =
        `${amount} ${from} = ${amount} ${to}`;

        exchangeRate.textContent =
        `1 ${from} = 1 ${to}`;

        return;

    }

    if(currentBase !== from){

        const ok =
        await fetchRates(from);

        if(!ok) return;

    }

    const rate =
    exchangeRates[to];

    if(rate === undefined){

        alert("ไม่พบอัตราแลกเปลี่ยน");

        return;

    }

    const converted =
    amount * rate;

    resultCard.style.display = "block";

    resultAmount.textContent =
    converted.toLocaleString("en-US",{

        minimumFractionDigits:2,

        maximumFractionDigits:2

    });

    resultCurrency.textContent =
    to;

    resultText.textContent =
    `${amount.toLocaleString()} ${from} = ${converted.toLocaleString("en-US",{

        minimumFractionDigits:2,

        maximumFractionDigits:2

    })} ${to}`;

    exchangeRate.textContent =
    `1 ${from} = ${rate.toLocaleString("en-US",{

        minimumFractionDigits:2,

        maximumFractionDigits:6

    })} ${to}`;

}

/* ===========================
   Copy Result
=========================== */

async function copyResult(){

    if(resultCard.style.display==="none"){

        return;

    }

    const text =

`${resultText.textContent}

${exchangeRate.textContent}`;

    try{

        await navigator.clipboard.writeText(text);

        copyBtn.textContent =
        "✅ คัดลอกแล้ว";

        setTimeout(()=>{

            copyBtn.textContent =
            "📋 คัดลอกผลลัพธ์";

        },2000);

    }catch(error){

        console.error(error);

    }

}

/* ===========================
   Swap Currency
=========================== */

function swapCurrencies(){

    const temp = fromCurrency.value;

    fromCurrency.value = toCurrency.value;

    toCurrency.value = temp;

    if(amountInput.value){

        convertCurrency();

    }

}

/* ===========================
   Reset Converter
=========================== */

function resetConverter(){

    amountInput.value = "1";

    fromCurrency.value = "THB";

    toCurrency.value = "USD";

    resultCard.style.display = "none";

    resultAmount.textContent = "0.00";

    resultCurrency.textContent = "USD";

    resultText.textContent = "";

    exchangeRate.textContent = "-";

}

/* ===========================
   Auto Convert
=========================== */

function autoConvert(){

    if(amountInput.value.trim() !== ""){

        convertCurrency();

    }

}

/* ===========================
   Events
=========================== */

convertBtn.addEventListener(

    "click",

    convertCurrency

);

amountInput.addEventListener(

    "input",

    autoConvert

);

fromCurrency.addEventListener(

    "change",

    autoConvert

);

toCurrency.addEventListener(

    "change",

    autoConvert

);

amountInput.addEventListener(

    "keydown",

    (event)=>{

        if(event.key==="Enter"){

            convertCurrency();

        }

    }

);

if(swapBtn){

    swapBtn.addEventListener(

        "click",

        swapCurrencies

    );

}

if(copyBtn){

    copyBtn.addEventListener(

        "click",

        copyResult

    );

}

if(resetBtn){

    resetBtn.addEventListener(

        "click",

        resetConverter

    );

}

/* ===========================
   Initialize
=========================== */

async function initialize(){

    try{

        const success =
        await fetchRates(fromCurrency.value);

        if(!success){

            console.warn("ไม่สามารถโหลดอัตราแลกเปลี่ยนเริ่มต้น");

        }

        resultCard.style.display = "none";

    }catch(error){

        console.error(error);

    }

}

initialize();

/* ===========================
   Online / Offline
=========================== */

window.addEventListener("online",()=>{

    console.log("Online");

    fetchRates(fromCurrency.value);

});

window.addEventListener("offline",()=>{

    console.warn("Offline");

});

/* ===========================
   Auto Refresh
=========================== */

setInterval(async ()=>{

    localStorage.removeItem(

        getCacheKey(currentBase)

    );

    await fetchRates(currentBase);

},CACHE_TIME);

/* ===========================
   Visibility Refresh
=========================== */

document.addEventListener(

    "visibilitychange",

    ()=>{

        if(document.visibilityState==="visible"){

            fetchRates(fromCurrency.value);

        }

    }

);

/* ===========================
   Global Error
=========================== */

window.addEventListener(

    "error",

    (event)=>{

        console.error(

            "Currency Converter Error",

            event.error

        );

    }

);

window.addEventListener(

    "unhandledrejection",

    (event)=>{

        console.error(

            "Promise Error",

            event.reason

        );

    }

);

/* ===========================
   Console
=========================== */

console.log(

    "ToolHub TH Currency Converter v3.1 Loaded"

);

/* ==========================================
   Currency Converter v3.1 FINAL
========================================== */

/* ===========================
   Prevent Invalid Input
=========================== */

amountInput.addEventListener("blur",()=>{

    let value=parseFloat(amountInput.value);

    if(isNaN(value)||value<=0){

        amountInput.value="1";

    }

});

/* ===========================
   Prevent Multiple Click
=========================== */

let isConverting=false;

const originalConvert=convertCurrency;

convertCurrency=async function(){

    if(isConverting){

        return;

    }

    isConverting=true;

    try{

        await originalConvert();

    }finally{

        isConverting=false;

    }

};

/* ===========================
   Popular Currency Shortcut
=========================== */

document.querySelectorAll(".popular-item").forEach(item=>{

    item.addEventListener("click",()=>{

        const text=item.textContent.trim();

        if(!text.includes("→")) return;

        const parts=text.split("→");

        const from=parts[0].trim();

        const to=parts[1].trim();

        if(currencyNames[from]&&currencyNames[to]){

            fromCurrency.value=from;

            toCurrency.value=to;

            convertCurrency();

        }

    });

});

/* ===========================
   Format Number While Typing
=========================== */

amountInput.addEventListener("focus",()=>{

    amountInput.select();

});

/* ===========================
   Auto Convert On Page Load
=========================== */

window.addEventListener("load",()=>{

    if(amountInput.value){

        convertCurrency();

    }

});

/* ===========================
   Version
=========================== */

console.log("================================");

console.log("ToolHub TH");

console.log("Currency Converter v3.1 FINAL");

console.log("Ready");

console.log("================================");
