"use strict";

/* ==========================================
   ToolHub TH
   Currency Converter v3.0
========================================== */

/* ===========================
   API CONFIG
=========================== */

const API_URL =
"https://open.er-api.com/v6/latest/";

const CACHE_TIME = 60 * 60 * 1000; // 1 ชั่วโมง

/* ===========================
   DOM
=========================== */

const amountInput =
document.getElementById("amount");

const fromCurrency =
document.getElementById("fromCurrency");

const toCurrency =
document.getElementById("toCurrency");

const convertBtn =
document.getElementById("convertBtn");

const resultBox =
document.getElementById("result");

const convertedAmount =
document.getElementById("convertedAmount");

const exchangeRate =
document.getElementById("exchangeRate");

const lastUpdate =
document.getElementById("lastUpdate");

const swapBtn =
document.getElementById("swapBtn");

/* ===========================
   Currency List
=========================== */

const currencies = {

THB:"🇹🇭 Thai Baht",

USD:"🇺🇸 US Dollar",

EUR:"🇪🇺 Euro",

GBP:"🇬🇧 British Pound",

JPY:"🇯🇵 Japanese Yen",

CNY:"🇨🇳 Chinese Yuan",

KRW:"🇰🇷 Korean Won",

SGD:"🇸🇬 Singapore Dollar",

MYR:"🇲🇾 Malaysian Ringgit",

VND:"🇻🇳 Vietnamese Dong",

PHP:"🇵🇭 Philippine Peso",

IDR:"🇮🇩 Indonesian Rupiah",

AUD:"🇦🇺 Australian Dollar",

NZD:"🇳🇿 New Zealand Dollar",

CAD:"🇨🇦 Canadian Dollar",

CHF:"🇨🇭 Swiss Franc",

HKD:"🇭🇰 Hong Kong Dollar",

INR:"🇮🇳 Indian Rupee",

AED:"🇦🇪 UAE Dirham",

SAR:"🇸🇦 Saudi Riyal"

};

/* ===========================
   Populate Select
=========================== */

function loadCurrencies(){

fromCurrency.innerHTML="";

toCurrency.innerHTML="";

Object.keys(currencies).forEach(code=>{

const option1=document.createElement("option");

option1.value=code;

option1.textContent=
`${currencies[code]} (${code})`;

const option2=option1.cloneNode(true);

fromCurrency.appendChild(option1);

toCurrency.appendChild(option2);

});

fromCurrency.value="THB";

toCurrency.value="USD";

}

loadCurrencies();

/* ===========================
   Cache
=========================== */

let exchangeRates={};

let currentBase="THB";

/* ===========================
   Loading
=========================== */

function setLoading(isLoading){

    if(!convertBtn) return;

    if(isLoading){

        convertBtn.disabled=true;
        convertBtn.textContent="กำลังแปลง...";

    }else{

        convertBtn.disabled=false;
        convertBtn.textContent="แปลงสกุลเงิน";

    }

}

/* ===========================
   Cache
=========================== */

function cacheKey(base){

    return `currency-cache-${base}`;

}

function saveCache(base,data){

    const payload={

        timestamp:Date.now(),
        rates:data

    };

    localStorage.setItem(
        cacheKey(base),
        JSON.stringify(payload)
    );

}

function readCache(base){

    const raw=
    localStorage.getItem(cacheKey(base));

    if(!raw) return null;

    try{

        const cache=JSON.parse(raw);

        if(Date.now()-cache.timestamp<CACHE_TIME){

            return cache.rates;

        }

    }catch(e){

        console.error(e);

    }

    return null;

}

/* ===========================
   Load Exchange Rates
=========================== */

async function loadRates(base){

    currentBase=base;

    const cached=readCache(base);

    if(cached){

        exchangeRates=cached;

        return true;

    }

    setLoading(true);

    try{

        const response=
        await fetch(API_URL+base);

        if(!response.ok){

            throw new Error("โหลดข้อมูลไม่สำเร็จ");

        }

        const data=
        await response.json();

        if(data.result!=="success"){

            throw new Error("API Error");

        }

        exchangeRates=data.rates;

        saveCache(base,data.rates);

        if(lastUpdate){

            const time=
            new Date(data.time_last_update_utc);

            lastUpdate.textContent=
            "อัปเดตล่าสุด : "+
            time.toLocaleString("th-TH");

        }

        return true;

    }catch(error){

        console.error(error);

        alert("ไม่สามารถโหลดอัตราแลกเปลี่ยนได้");

        return false;

    }finally{

        setLoading(false);

    }

}

/* ===========================
   Convert Currency
=========================== */

async function convertCurrency(){

    const amount=
    parseFloat(amountInput.value);

    const from=
    fromCurrency.value;

    const to=
    toCurrency.value;

    if(isNaN(amount)||amount<=0){

        alert("กรุณากรอกจำนวนเงิน");

        amountInput.focus();

        return;

    }

    if(currentBase!==from){

        const ok=
        await loadRates(from);

        if(!ok) return;

    }

    const rate=
    exchangeRates[to];

    if(!rate){

        alert("ไม่พบอัตราแลกเปลี่ยน");

        return;

    }

    const result=
    amount*rate;

    resultBox.style.display="block";

    convertedAmount.innerHTML=

    `${amount.toLocaleString("en-US")} ${from}
    <br><br>
    =
    <br><br>
    <strong>${result.toLocaleString("en-US",{

        minimumFractionDigits:2,

        maximumFractionDigits:2

    })} ${to}</strong>`;

    exchangeRate.innerHTML=

    `1 ${from} = ${rate.toLocaleString("en-US",{

        minimumFractionDigits:2,

        maximumFractionDigits:6

    })} ${to}`;

}

/* ===========================
   Swap Currency
=========================== */

function swapCurrencies(){

    const temp=
    fromCurrency.value;

    fromCurrency.value=
    toCurrency.value;

    toCurrency.value=
    temp;

    if(amountInput.value){

        convertCurrency();

    }

}

/* ===========================
   Reset
=========================== */

function resetConverter(){

    amountInput.value="";

    fromCurrency.value="THB";

    toCurrency.value="USD";

    resultBox.style.display="none";

}

/* ===========================
   Auto Convert
=========================== */

amountInput.addEventListener("input",()=>{

    if(amountInput.value){

        convertCurrency();

    }

});

fromCurrency.addEventListener("change",()=>{

    if(amountInput.value){

        convertCurrency();

    }

});

toCurrency.addEventListener("change",()=>{

    if(amountInput.value){

        convertCurrency();

    }

});

/* ===========================
   Button Events
=========================== */

convertBtn.addEventListener(

"click",

convertCurrency

);

if(swapBtn){

    swapBtn.addEventListener(

    "click",

    swapCurrencies

    );

}

/* ===========================
   Keyboard Shortcut
=========================== */

amountInput.addEventListener("keydown",(event)=>{

    if(event.key==="Enter"){

        convertCurrency();

    }

});

/* ===========================
   Window Online / Offline
=========================== */

window.addEventListener("offline",()=>{

    console.warn("Offline Mode");

});

window.addEventListener("online",()=>{

    if(amountInput.value){

        convertCurrency();

    }

});

/* ===========================
   Initialize
=========================== */

async function initialize(){

    try{

        await loadRates(fromCurrency.value);

        if(lastUpdate){

            lastUpdate.style.display="block";

        }

        if(resultBox){

            resultBox.style.display="none";

        }

    }catch(error){

        console.error(error);

    }

}

initialize();

/* ===========================
   Auto Refresh Every Hour
=========================== */

setInterval(()=>{

    localStorage.removeItem(

        cacheKey(currentBase)

    );

},CACHE_TIME);

/* ===========================
   Global Error Handler
=========================== */

window.addEventListener("error",(event)=>{

    console.error(

        "Currency Converter Error:",

        event.error

    );

});

/* ===========================
   Version
=========================== */

console.log(

"ToolHub TH Currency Converter v3.0 Loaded"

);
