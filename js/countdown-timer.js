// =========================
// Elements
// =========================

const tabStopwatch = document.getElementById("tabStopwatch");
const tabCountdown = document.getElementById("tabCountdown");
const panelStopwatch = document.getElementById("panelStopwatch");
const panelCountdown = document.getElementById("panelCountdown");

const swDisplay = document.getElementById("swDisplay");
const swStartBtn = document.getElementById("swStartBtn");
const swPauseBtn = document.getElementById("swPauseBtn");
const swResetBtn = document.getElementById("swResetBtn");
const swLapBtn = document.getElementById("swLapBtn");
const swLapList = document.getElementById("swLapList");
const swLapBody = document.querySelector("#swLapTable tbody");

const cdDisplay = document.getElementById("cdDisplay");
const cdHours = document.getElementById("cdHours");
const cdMinutes = document.getElementById("cdMinutes");
const cdSeconds = document.getElementById("cdSeconds");
const cdStartBtn = document.getElementById("cdStartBtn");
const cdPauseBtn = document.getElementById("cdPauseBtn");
const cdResetBtn = document.getElementById("cdResetBtn");
const presetButtons = document.querySelectorAll(".preset-buttons button");

// =========================
// Tabs
// =========================

tabStopwatch.addEventListener("click", () => switchTab("stopwatch"));
tabCountdown.addEventListener("click", () => switchTab("countdown"));

function switchTab(mode) {
    const isSw = mode === "stopwatch";

    tabStopwatch.classList.toggle("active", isSw);
    tabCountdown.classList.toggle("active", !isSw);
    panelStopwatch.classList.toggle("active", isSw);
    panelCountdown.classList.toggle("active", !isSw);
}

// =========================
// Helpers
// =========================

function pad(num, len = 2) {
    return String(num).padStart(len, "0");
}

function formatStopwatch(ms) {
    const totalCentiseconds = Math.floor(ms / 10);
    const centiseconds = totalCentiseconds % 100;
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

function formatCountdown(totalSeconds) {
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// =========================
// Beep sound (Web Audio API, no external files)
// =========================

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.value = 0.2;

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
        // เบราว์เซอร์บางตัวอาจไม่รองรับ Web Audio API
    }
}

// =========================
// Stopwatch logic
// =========================

let swElapsed = 0;
let swStartTime = null;
let swInterval = null;
let lapCount = 0;

function swTick() {
    const now = performance.now();
    const current = swElapsed + (now - swStartTime);
    swDisplay.textContent = formatStopwatch(current);
}

swStartBtn.addEventListener("click", () => {
    swStartTime = performance.now();
    swInterval = setInterval(swTick, 33);

    swStartBtn.disabled = true;
    swPauseBtn.disabled = false;
    swLapBtn.disabled = false;
    swResetBtn.disabled = false;
});

swPauseBtn.addEventListener("click", () => {
    clearInterval(swInterval);
    swElapsed += performance.now() - swStartTime;

    swStartBtn.disabled = false;
    swPauseBtn.disabled = true;
    swLapBtn.disabled = true;
});

swResetBtn.addEventListener("click", () => {
    clearInterval(swInterval);
    swElapsed = 0;
    swStartTime = null;
    lapCount = 0;

    swDisplay.textContent = formatStopwatch(0);
    swLapBody.innerHTML = "";
    swLapList.style.display = "none";

    swStartBtn.disabled = false;
    swPauseBtn.disabled = true;
    swLapBtn.disabled = true;
});

swLapBtn.addEventListener("click", () => {
    lapCount += 1;

    const now = performance.now();
    const current = swElapsed + (now - swStartTime);

    const row = document.createElement("tr");
    row.innerHTML = `<td>รอบที่ ${lapCount}</td><td>${formatStopwatch(current)}</td>`;
    swLapBody.prepend(row);

    swLapList.style.display = "block";
});

// =========================
// Countdown logic
// =========================

let cdRemaining = 0;
let cdInterval = null;
let cdRunning = false;

presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const seconds = parseInt(btn.dataset.seconds, 10);
        cdHours.value = Math.floor(seconds / 3600);
        cdMinutes.value = Math.floor((seconds % 3600) / 60);
        cdSeconds.value = seconds % 60;
        cdDisplay.textContent = formatCountdown(seconds);
        cdDisplay.classList.remove("warning");
    });
});

[cdHours, cdMinutes, cdSeconds].forEach(input => {
    input.addEventListener("input", () => {
        if (cdRunning) return;
        const total = getCountdownInputSeconds();
        cdDisplay.textContent = formatCountdown(total);
    });
});

function getCountdownInputSeconds() {
    const h = parseInt(cdHours.value, 10) || 0;
    const m = parseInt(cdMinutes.value, 10) || 0;
    const s = parseInt(cdSeconds.value, 10) || 0;
    return (h * 3600) + (m * 60) + s;
}

cdStartBtn.addEventListener("click", () => {
    if (!cdRunning) {
        cdRemaining = getCountdownInputSeconds();

        if (cdRemaining <= 0) {
            alert("กรุณาตั้งเวลานับถอยหลังก่อนเริ่ม");
            return;
        }
    }

    cdRunning = true;
    cdDisplay.classList.remove("warning");

    cdInterval = setInterval(() => {
        cdRemaining -= 1;

        if (cdRemaining <= 0) {
            cdDisplay.textContent = formatCountdown(0);
            clearInterval(cdInterval);
            cdRunning = false;
            cdDisplay.classList.remove("warning");
            playBeep();

            cdStartBtn.disabled = false;
            cdPauseBtn.disabled = true;
            return;
        }

        cdDisplay.textContent = formatCountdown(cdRemaining);

        if (cdRemaining <= 10) {
            cdDisplay.classList.add("warning");
        }

    }, 1000);

    cdStartBtn.disabled = true;
    cdPauseBtn.disabled = false;
    cdHours.disabled = true;
    cdMinutes.disabled = true;
    cdSeconds.disabled = true;
});

cdPauseBtn.addEventListener("click", () => {
    clearInterval(cdInterval);
    cdRunning = false;

    cdStartBtn.disabled = false;
    cdPauseBtn.disabled = true;
});

cdResetBtn.addEventListener("click", () => {
    clearInterval(cdInterval);
    cdRunning = false;
    cdRemaining = 0;

    cdHours.value = 0;
    cdMinutes.value = 5;
    cdSeconds.value = 0;
    cdHours.disabled = false;
    cdMinutes.disabled = false;
    cdSeconds.disabled = false;

    cdDisplay.textContent = formatCountdown(300);
    cdDisplay.classList.remove("warning");

    cdStartBtn.disabled = false;
    cdPauseBtn.disabled = true;
});

// =========================
// Init
// =========================

swDisplay.textContent = formatStopwatch(0);
cdDisplay.textContent = formatCountdown(300);
