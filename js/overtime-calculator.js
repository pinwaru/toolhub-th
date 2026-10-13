// =========================
// อัตราค่าล่วงเวลา / ค่าทำงานในวันหยุด ตาม พ.ร.บ.คุ้มครองแรงงาน พ.ศ. 2541
// (ตัวคูณของ "ค่าจ้างต่อชั่วโมง")
// =========================
//
// - ล่วงเวลาในวันทำงานปกติ ........................ 1.5 เท่า (ม.61)
// - ทำงานในวันหยุด (ภายในเวลาทำงานปกติ)
//     ลูกจ้างรายเดือน (ได้ค่าจ้างวันหยุดอยู่แล้ว) .. เพิ่มอีก 1 เท่า (ม.62)
//     ลูกจ้างรายวัน (ไม่ได้ค่าจ้างวันหยุดประจำสัปดาห์) .. 2 เท่า (ม.62)
// - ทำงานในวันหยุดตามประเพณี (ได้ค่าจ้างวันหยุดทั้งรายเดือน/รายวัน) .. เพิ่มอีก 1 เท่า
// - ล่วงเวลาในวันหยุด ............................. 3 เท่า (ม.63)

const DAYS_PER_MONTH = 30; // เกณฑ์แปลงเงินเดือนเป็นค่าจ้างรายวัน

const OT_CATEGORIES = [
    {
        key: "weekdayOT",
        label: "ล่วงเวลาในวันทำงานปกติ",
        rate: { monthly: 1.5, daily: 1.5 }
    },
    {
        key: "weeklyHolidayNormal",
        label: "ทำงานวันหยุดประจำสัปดาห์ (ภายในเวลาทำงานปกติ)",
        rate: { monthly: 1, daily: 2 }
    },
    {
        key: "weeklyHolidayOT",
        label: "ล่วงเวลาในวันหยุดประจำสัปดาห์",
        rate: { monthly: 3, daily: 3 }
    },
    {
        key: "publicHolidayNormal",
        label: "ทำงานวันหยุดนักขัตฤกษ์ (ภายในเวลาทำงานปกติ)",
        rate: { monthly: 1, daily: 1 }
    },
    {
        key: "publicHolidayOT",
        label: "ล่วงเวลาในวันหยุดนักขัตฤกษ์",
        rate: { monthly: 3, daily: 3 }
    }
];

// =========================
// ฟังก์ชันคำนวณ (ไม่แตะ DOM)
// =========================

function calculateHourlyRate(payType, wage, hoursPerDay) {
    const dailyWage = payType === "monthly" ? wage / DAYS_PER_MONTH : wage;
    return dailyWage / hoursPerDay;
}

function calculateOvertime(input) {
    const { payType, wage, hoursPerDay, hours } = input;

    const hourlyRate = calculateHourlyRate(payType, wage, hoursPerDay);

    const rows = OT_CATEGORIES.map(cat => {
        const h = hours[cat.key] || 0;
        const multiplier = cat.rate[payType];
        const amount = h * hourlyRate * multiplier;
        return { key: cat.key, label: cat.label, hours: h, multiplier, hourlyRate, amount };
    });

    const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);
    const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

    return {
        hourlyRate,
        dailyWage: hourlyRate * hoursPerDay,
        rows,
        totalHours,
        totalAmount,
        grossMonthly: payType === "monthly" ? wage + totalAmount : null
    };
}

// =========================
// ส่วนแสดงผล (ทำงานเฉพาะในเบราว์เซอร์)
// =========================

if (typeof document !== "undefined") {

    const payTypeInput = document.getElementById("payType");
    const wageInput = document.getElementById("wage");
    const wageLabel = document.getElementById("wageLabel");
    const hoursPerDayInput = document.getElementById("hoursPerDay");

    const hourInputs = {};
    OT_CATEGORIES.forEach(cat => {
        hourInputs[cat.key] = document.getElementById(cat.key);
    });

    const calculateBtn = document.getElementById("calculateBtn");
    const errorEl = document.getElementById("otError");

    const totalOtEl = document.getElementById("totalOt");
    const hourlyRateEl = document.getElementById("hourlyRate");
    const dailyWageEl = document.getElementById("dailyWage");
    const totalHoursEl = document.getElementById("totalHours");
    const grossItemEl = document.getElementById("grossItem");
    const grossMonthlyEl = document.getElementById("grossMonthly");
    const breakdownBody = document.querySelector("#otTable tbody");

    function formatNumber(value) {
        return value.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatHours(value) {
        return value.toLocaleString("th-TH", { maximumFractionDigits: 2 });
    }

    function showError(message) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }

    function clearError() {
        errorEl.textContent = "";
        errorEl.style.display = "none";
    }

    function updatePayTypeLabels() {
        const isMonthly = payTypeInput.value === "monthly";
        wageLabel.textContent = isMonthly ? "เงินเดือน (บาท/เดือน)" : "ค่าจ้างรายวัน (บาท/วัน)";
        wageInput.placeholder = isMonthly ? "18000" : "600";
    }

    function renderTable(rows, payType) {
        breakdownBody.innerHTML = "";
        const fragment = document.createDocumentFragment();

        rows.forEach(r => {
            const tr = document.createElement("tr");

            let rateText = `${r.multiplier} เท่า`;
            if (payType === "monthly" && (r.key === "weeklyHolidayNormal" || r.key === "publicHolidayNormal")) {
                rateText = "เพิ่มอีก 1 เท่า";
            } else if (payType === "daily" && r.key === "publicHolidayNormal") {
                rateText = "เพิ่มอีก 1 เท่า";
            }

            [r.label, formatHours(r.hours), rateText, formatNumber(r.hourlyRate), formatNumber(r.amount)]
                .forEach((text, i) => {
                    const td = document.createElement("td");
                    td.textContent = text;
                    if (i === 0) td.className = "left";
                    tr.appendChild(td);
                });

            if (r.hours > 0) tr.classList.add("active-row");
            fragment.appendChild(tr);
        });

        breakdownBody.appendChild(fragment);
    }

    function runCalculation() {
        clearError();

        const payType = payTypeInput.value;
        const wage = parseFloat(wageInput.value);
        const hoursPerDay = parseFloat(hoursPerDayInput.value);

        if (isNaN(wage) || wage <= 0) {
            showError(payType === "monthly" ? "กรุณากรอกเงินเดือนให้ถูกต้อง" : "กรุณากรอกค่าจ้างรายวันให้ถูกต้อง");
            return;
        }

        if (isNaN(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24) {
            showError("กรุณากรอกชั่วโมงทำงานปกติต่อวันให้ถูกต้อง (1–24 ชั่วโมง)");
            return;
        }

        const hours = {};
        for (const cat of OT_CATEGORIES) {
            const raw = hourInputs[cat.key].value;
            const h = raw === "" ? 0 : parseFloat(raw);
            if (isNaN(h) || h < 0) {
                showError("จำนวนชั่วโมงต้องไม่ติดลบ");
                return;
            }
            hours[cat.key] = h;
        }

        const result = calculateOvertime({ payType, wage, hoursPerDay, hours });

        totalOtEl.textContent = `${formatNumber(result.totalAmount)} บาท`;
        hourlyRateEl.textContent = `${formatNumber(result.hourlyRate)} บาท`;
        dailyWageEl.textContent = `${formatNumber(result.dailyWage)} บาท`;
        totalHoursEl.textContent = `${formatHours(result.totalHours)} ชั่วโมง`;

        if (result.grossMonthly !== null) {
            grossItemEl.style.display = "block";
            grossMonthlyEl.textContent = `${formatNumber(result.grossMonthly)} บาท`;
        } else {
            grossItemEl.style.display = "none";
        }

        renderTable(result.rows, payType);
    }

    payTypeInput.addEventListener("change", updatePayTypeLabels);
    calculateBtn.addEventListener("click", runCalculation);

    [wageInput, hoursPerDayInput, ...Object.values(hourInputs)].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") runCalculation();
        });
    });

    updatePayTypeLabels();
}

if (typeof module !== "undefined") {
    module.exports = { calculateOvertime, calculateHourlyRate, OT_CATEGORIES };
}
