"use strict";

/* ==========================================
   ToolHub TH
   Currency Converter v3.1 FINAL (Fixed)
========================================== */

/* ===========================
   API & Cache Config
=========================== */
const API_URL = "https://open.er-api.com/v6/latest/";
const CACHE_TIME = 60 * 60 * 1000; // 1 ชั่วโมง

/* ===========================
   DOM Elements
=========================== */
const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const convertBtn = document.getElementById("convertBtn");
const swapBtn = document.getElementById("swapBtn");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");

/* ===========================
   Result Elements
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
    THB: "🇹🇭 Thai Baht",
    USD: "🇺🇸 US Dollar",
    EUR: "🇪🇺 Euro",
    GBP: "🇬🇧 British Pound",
    JPY: "🇯🇵 Japanese Yen",
    CNY: "🇨🇳 Chinese Yuan",
    KRW: "🇰🇷 Korean Won",
    SGD: "🇸🇬 Singapore Dollar",
    HKD: "🇭🇰 Hong Kong Dollar",
    AUD: "🇦🇺 Australian Dollar",
    CAD: "🇨🇦 Canadian Dollar",
    CHF: "🇨🇭 Swiss Franc",
    MYR: "🇲🇾 Malaysian Ringgit",
    VND: "🇻🇳 Vietnamese Dong",
    INR: "🇮🇳 Indian Rupee",
    PHP: "🇵🇭 Philippine Peso",
    IDR: "🇮🇩 Indonesian Rupiah",
    AED: "🇦🇪 UAE Dirham",
    SAR: "🇸🇦 Saudi Riyal",
    NZD: "🇳🇿 New Zealand Dollar"
};

/* ===========================
   Global State
=========================== */
let exchangeRates = {};
let currentBase = "THB";
let isConverting = false;

/* ===========================
   Loading UI
=========================== */
function setLoading(loading) {
    if (!convertBtn) return;
    if (loading) {
        convertBtn.disabled = true;
        convertBtn.textContent = "กำลังโหลดข้อมูล...";
    } else {
        convertBtn.disabled = false;
        convertBtn.textContent = "แปลงสกุลเงิน";
    }
}

/* ===========================
   Cache System
=========================== */
function getCacheKey(base) {
    return `toolhub_currency_${base}`;
}

function saveCache(base, rates, time) {
    const data = {
        timestamp: Date.now(),
        rates: rates,
        updateTime: time
    };
    try {
        localStorage.setItem(getCacheKey(base), JSON.stringify(data));
    } catch (e) {
        console.warn("Storage full or unavailable");
    }
}

function loadCache(base) {
    const raw = localStorage.getItem(getCacheKey(base));
    if (!raw) return null;

    try {
        const cache = JSON.parse(raw);
        const age = Date.now() - cache.timestamp;
        if (age < CACHE_TIME) {
            return cache;
        }
    } catch (error) {
        console.error("Cache read error:", error);
    }
    return null;
}

/* ===========================
   Fetch API Rates
=========================== */
async function fetchRates(base) {
    currentBase = base;
    const cache = loadCache(base);

    if (cache) {
        exchangeRates = cache.rates;
        if (lastUpdated) {
            lastUpdated.textContent = new Date(cache.updateTime).toLocaleString("th-TH");
        }
        return true;
    }

    setLoading(true);

    try {
        const response = await fetch(API_URL + base);
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        if (data.result !== "success") throw new Error("API returned failure status");

        exchangeRates = data.rates;
        saveCache(base, data.rates, data.time_last_update_utc);

        if (lastUpdated) {
            lastUpdated.textContent = new Date(data.time_last_update_utc).toLocaleString("th-TH");
        }
        return true;
    } catch (error) {
        console.error("Fetch rates error:", error);
        alert("ไม่สามารถโหลดอัตราแลกเปลี่ยนล่าสุดได้\nกรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
        return false;
    } finally {
        setLoading(false);
    }
}

/* ===========================
   Convert Main Logic
=========================== */
async function convertCurrency() {
    if (isConverting) return;
    isConverting = true;

    try {
        const amount = parseFloat(amountInput.value);

        if (isNaN(amount) || amount <= 0) {
            alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
            amountInput.focus();
            return;
        }

        const from = fromCurrency.value;
        const to = toCurrency.value;

        if (from === to) {
            showResult(
                amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                to,
                `${amount.toLocaleString()} ${from} = ${amount.toLocaleString()} ${to}`,
                `1 ${from} = 1 ${to}`
            );
            return;
        }

        if (currentBase !== from || Object.keys(exchangeRates).length === 0) {
            const ok = await fetchRates(from);
            if (!ok) return;
        }

        const rate = exchangeRates[to];
        if (rate === undefined) {
            alert("ไม่พบข้อมูลอัตราแลกเปลี่ยนของสกุลเงินที่เลือก");
            return;
        }

        const converted = amount * rate;

        showResult(
            converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            to,
            `${amount.toLocaleString()} ${from} = ${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`,
            `1 ${from} = ${rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${to}`
        );

    } finally {
        isConverting = false;
    }
}

/* ===========================
   UI Helper
=========================== */
function showResult(val, curr, text, rateText) {
    if (!resultCard) return;
    resultCard.classList.remove("hidden");
    resultCard.style.display = "block";

    if (resultAmount) resultAmount.textContent = val;
    if (resultCurrency) resultCurrency.textContent = curr;
    if (resultText) resultText.textContent = text;
    if (exchangeRate) exchangeRate.textContent = rateText;
}

/* ===========================
   Copy & Actions
=========================== */
async function copyResult() {
    if (!resultText || !exchangeRate) return;
    const text = `${resultText.textContent}\n${exchangeRate.textContent}`;

    try {
        await navigator.clipboard.writeText(text);
        if (copyBtn) {
            const oldText = copyBtn.textContent;
            copyBtn.textContent = "✅ คัดลอกแล้ว";
            setTimeout(() => { copyBtn.textContent = oldText; }, 2000);
        }
    } catch (error) {
        console.error("Copy failed:", error);
    }
}

function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    convertCurrency();
}

function resetConverter() {
    amountInput.value = "1";
    fromCurrency.value = "THB";
    toCurrency.value = "USD";

    if (resultCard) {
        resultCard.classList.add("hidden");
        resultCard.style.display = "none";
    }
    if (resultAmount) resultAmount.textContent = "0.00";
    if (resultCurrency) resultCurrency.textContent = "USD";
    if (resultText) resultText.textContent = "";
    if (exchangeRate) exchangeRate.textContent = "-";
}

/* ===========================
   Event Listeners
=========================== */
if (convertBtn) convertBtn.addEventListener("click", convertCurrency);
if (swapBtn) swapBtn.addEventListener("click", swapCurrencies);
if (copyBtn) copyBtn.addEventListener("click", copyResult);
if (resetBtn) resetBtn.addEventListener("click", resetConverter);

if (amountInput) {
    amountInput.addEventListener("input", () => {
        if (amountInput.value.trim() !== "") convertCurrency();
    });
    amountInput.addEventListener("focus", () => amountInput.select());
    amountInput.addEventListener("blur", () => {
        let val = parseFloat(amountInput.value);
        if (isNaN(val) || val <= 0) amountInput.value = "1";
    });
    amountInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") convertCurrency();
    });
}

if (fromCurrency) fromCurrency.addEventListener("change", convertCurrency);
if (toCurrency) toCurrency.addEventListener("change", convertCurrency);

// Popular Shortcut Items
document.querySelectorAll(".popular-item").forEach(item => {

    item.addEventListener("click", () => {

        const text = item.textContent.trim();

        if (!text.includes("→")) return;

        const parts = text.split("→");

        const from = parts[0].trim();

        const to = parts[1].trim();

        if (fromCurrency && toCurrency) {

            fromCurrency.value = from;

            toCurrency.value = to;

            convertCurrency();

        }

    });

});

/* ===========================
   Initialize & Auto Loads
=========================== */
async function initialize() {
    if (fromCurrency) {
        await fetchRates(fromCurrency.value);
        convertCurrency();
    }
}

window.addEventListener("DOMContentLoaded", initialize);

// Online / Offline
window.addEventListener("online", () => {
    if (fromCurrency) fetchRates(fromCurrency.value);
});

// Auto Refresh ทุก 1 ชั่วโมง
setInterval(() => {
    if (currentBase) {
        localStorage.removeItem(getCacheKey(currentBase));
        fetchRates(currentBase);
    }
}, CACHE_TIME);
