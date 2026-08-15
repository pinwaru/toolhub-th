// =========================
// Elements
// =========================

const lmpInput = document.getElementById("lmpDate");
const cycleInput = document.getElementById("cycleLength");
const calculateBtn = document.getElementById("calculateBtn");

const dueDateEl = document.getElementById("dueDate");
const gestAgeEl = document.getElementById("gestAge");
const trimesterEl = document.getElementById("trimester");
const daysLeftEl = document.getElementById("daysLeft");
const conceptionEl = document.getElementById("conceptionDate");

const trimesterSegs = document.querySelectorAll(".trimester-bar .seg");

// =========================
// Helpers
// =========================

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

function formatThaiDate(date) {
    const day = date.getDate();
    const month = THAI_MONTHS[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function daysBetween(a, b) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcB - utcA) / msPerDay);
}

// =========================
// คำนวณอายุครรภ์
// =========================

function calculatePregnancy() {
    const lmpValue = lmpInput.value;

    if (!lmpValue) {
        alert("กรุณาเลือกวันแรกของประจำเดือนครั้งล่าสุด");
        return;
    }

    const [year, month, day] = lmpValue.split("-").map(Number);
    const lmpDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cycleLength = parseInt(cycleInput.value, 10) || 28;
    const cycleAdjustment = cycleLength - 28;

    const daysSinceLMP = daysBetween(lmpDate, today);

    if (daysSinceLMP < 0) {
        alert("วันแรกของประจำเดือนต้องไม่ใช่วันในอนาคต");
        return;
    }

    if (daysSinceLMP > 315) {
        alert("วันที่ที่เลือกนานเกินไป (เกิน 45 สัปดาห์) กรุณาตรวจสอบวันที่อีกครั้ง");
        return;
    }

    // กำหนดคลอด (EDD) = LMP + 280 วัน ปรับตามความยาวรอบเดือน
    const dueDate = addDays(lmpDate, 280 + cycleAdjustment);

    // วันที่คาดว่าปฏิสนธิ ≈ LMP + (ความยาวรอบเดือน - 14)
    const conceptionDate = addDays(lmpDate, cycleLength - 14);

    // อายุครรภ์ปัจจุบัน
    const gestWeeks = Math.floor(daysSinceLMP / 7);
    const gestDays = daysSinceLMP % 7;

    // ไตรมาส
    let trimester = 1;
    if (gestWeeks >= 28) {
        trimester = 3;
    } else if (gestWeeks >= 14) {
        trimester = 2;
    }

    // จำนวนวันที่เหลือถึงกำหนดคลอด
    const daysLeft = daysBetween(today, dueDate);

    // =========================
    // แสดงผล
    // =========================

    dueDateEl.textContent = formatThaiDate(dueDate);
    gestAgeEl.textContent = `${gestWeeks} สัปดาห์ ${gestDays} วัน`;
    trimesterEl.textContent = `ไตรมาสที่ ${trimester}`;
    daysLeftEl.textContent = daysLeft > 0 ? `เหลืออีก ${daysLeft} วัน` : "ถึงกำหนดคลอดแล้ว";
    conceptionEl.textContent = formatThaiDate(conceptionDate);

    trimesterSegs.forEach((seg, index) => {
        seg.classList.toggle("active", index < trimester);
    });
}

calculateBtn.addEventListener("click", calculatePregnancy);

lmpInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") calculatePregnancy();
});
