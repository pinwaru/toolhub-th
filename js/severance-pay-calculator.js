// =========================
// อัตราค่าชดเชยเลิกจ้าง ตาม พ.ร.บ.คุ้มครองแรงงาน พ.ศ. 2541 มาตรา 118
// =========================
//
// อายุงาน (นับครบเต็มปี)                    ค่าชดเชย (วันของค่าจ้างอัตราสุดท้าย)
// ครบ 120 วัน แต่ไม่ครบ 1 ปี ................ 30 วัน
// ครบ 1 ปี แต่ไม่ครบ 3 ปี .................. 90 วัน
// ครบ 3 ปี แต่ไม่ครบ 6 ปี .................. 180 วัน
// ครบ 6 ปี แต่ไม่ครบ 10 ปี ................. 240 วัน
// ครบ 10 ปี แต่ไม่ครบ 20 ปี ................ 300 วัน
// ครบ 20 ปีขึ้นไป .......................... 400 วัน

const DAYS_PER_MONTH = 30;       // เกณฑ์แปลงเงินเดือนเป็นค่าจ้างรายวัน
const MIN_SERVICE_DAYS = 120;    // อายุงานขั้นต่ำที่เริ่มมีสิทธิ์
const NOTICE_DAYS = 30;          // ค่าบอกกล่าวล่วงหน้า 1 งวดการจ่ายค่าจ้าง (โดยทั่วไป 1 เดือน)

// ขั้นของอัตราค่าชดเชย (minYears = อายุงานเต็มปีขั้นต่ำ)
const SEVERANCE_TIERS = [
    { key: "t0",  minYears: 0,  days: 30,  label: "ครบ 120 วัน แต่ไม่ครบ 1 ปี" },
    { key: "t1",  minYears: 1,  days: 90,  label: "ครบ 1 ปี แต่ไม่ครบ 3 ปี" },
    { key: "t3",  minYears: 3,  days: 180, label: "ครบ 3 ปี แต่ไม่ครบ 6 ปี" },
    { key: "t6",  minYears: 6,  days: 240, label: "ครบ 6 ปี แต่ไม่ครบ 10 ปี" },
    { key: "t10", minYears: 10, days: 300, label: "ครบ 10 ปี แต่ไม่ครบ 20 ปี" },
    { key: "t20", minYears: 20, days: 400, label: "ครบ 20 ปีขึ้นไป" }
];

const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const DAY_MS = 86400000;

// =========================
// ฟังก์ชันช่วยเรื่องวันที่ (ใช้ UTC เพื่อไม่ให้เขตเวลาทำให้คลาดเคลื่อน)
// =========================

function parseDate(str) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str || "")) return null;
    const [y, m, d] = str.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    // กันวันที่ที่ไม่มีจริง เช่น 31 กุมภาพันธ์
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return dt;
}

function addDays(dt, n) {
    return new Date(dt.getTime() + n * DAY_MS);
}

function addYears(dt, n) {
    return new Date(Date.UTC(dt.getUTCFullYear() + n, dt.getUTCMonth(), dt.getUTCDate()));
}

function daysInMonth(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function formatThaiDate(dt) {
    return `${dt.getUTCDate()} ${THAI_MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear() + 543}`;
}

// =========================
// อายุงาน: นับรวมวันเริ่มงานและวันทำงานวันสุดท้าย
// (คำนวณถึงสิ้นวันสุดท้าย = วันถัดไป 00:00)
// =========================

function calculateService(startStr, endStr) {
    const start = parseDate(startStr);
    const end = parseDate(endStr);
    if (!start || !end) return { error: "กรุณาเลือกวันเริ่มงานและวันทำงานวันสุดท้ายให้ถูกต้อง" };
    if (end < start) return { error: "วันทำงานวันสุดท้ายต้องไม่ก่อนวันเริ่มงาน" };

    const endEx = addDays(end, 1);

    let years = endEx.getUTCFullYear() - start.getUTCFullYear();
    let months = endEx.getUTCMonth() - start.getUTCMonth();
    let days = endEx.getUTCDate() - start.getUTCDate();

    let y = endEx.getUTCFullYear();
    let m = endEx.getUTCMonth();
    while (days < 0) {
        m -= 1;
        if (m < 0) { m = 11; y -= 1; }
        days += daysInMonth(y, m);
        months -= 1;
    }
    while (months < 0) {
        months += 12;
        years -= 1;
    }

    const totalDays = Math.round((endEx - start) / DAY_MS);

    return { start, end, endEx, years, months, days, totalDays };
}

// =========================
// ขั้นค่าชดเชยตามอายุงาน
// =========================

function getSeveranceTier(service) {
    if (service.totalDays < MIN_SERVICE_DAYS) return null;
    let tier = SEVERANCE_TIERS[0];
    for (const t of SEVERANCE_TIERS) {
        if (service.years >= t.minYears) tier = t;
    }
    return tier;
}

// ขั้นถัดไปและจำนวนวันที่ต้องทำงานเพิ่ม
function getNextMilestone(service) {
    let targetEx; // วันที่ที่ต้อง "ครบ" (วันถัดจากวันทำงานวันสุดท้ายที่ต้องการ)
    let days;

    if (service.totalDays < MIN_SERVICE_DAYS) {
        targetEx = addDays(service.start, MIN_SERVICE_DAYS);
        days = 30;
    } else {
        const next = SEVERANCE_TIERS.find(t => t.minYears > service.years && t.minYears >= 1);
        if (!next) return null;
        targetEx = addYears(service.start, next.minYears);
        days = next.days;
    }

    return {
        remainingDays: Math.round((targetEx - service.endEx) / DAY_MS),
        lastDay: addDays(targetEx, -1),
        days
    };
}

// =========================
// คำนวณค่าชดเชย (ไม่แตะ DOM)
// =========================

function calculateSeverance(input) {
    const { payType, wage, startDate, endDate, reason, includeNotice } = input;

    const service = calculateService(startDate, endDate);
    if (service.error) return { error: service.error };

    const dailyRate = payType === "monthly" ? wage / DAYS_PER_MONTH : wage;
    const tier = getSeveranceTier(service);

    let eligible = true;
    let ineligibleReason = "";

    if (reason === "resigned") {
        eligible = false;
        ineligibleReason = "กรณีลาออกเอง ไม่มีสิทธิ์ได้ค่าชดเชยเลิกจ้างตามกฎหมาย";
    } else if (reason === "misconduct") {
        eligible = false;
        ineligibleReason = "กรณีเลิกจ้างด้วยเหตุตามมาตรา 119 (เช่น ทุจริต ทำผิดวินัยร้ายแรง) นายจ้างไม่ต้องจ่ายค่าชดเชย";
    } else if (!tier) {
        eligible = false;
        ineligibleReason = "อายุงานยังไม่ครบ 120 วัน จึงยังไม่มีสิทธิ์ได้ค่าชดเชยเลิกจ้าง";
    }

    const severanceDays = eligible ? tier.days : 0;
    const severancePay = severanceDays * dailyRate;

    // ค่าบอกกล่าวล่วงหน้า ใช้กับการเลิกจ้างที่ไม่มีความผิดเท่านั้น
    const noticePay = reason === "dismissed" && includeNotice ? NOTICE_DAYS * dailyRate : 0;

    return {
        service,
        dailyRate,
        tier,
        eligible,
        ineligibleReason,
        severanceDays,
        severancePay,
        noticePay,
        total: severancePay + noticePay,
        next: getNextMilestone(service)
    };
}

// =========================
// ส่วนแสดงผล (ทำงานเฉพาะในเบราว์เซอร์)
// =========================

if (typeof document !== "undefined") {

    const $ = id => document.getElementById(id);

    const payTypeInput = $("payType");
    const wageInput = $("wage");
    const wageLabel = $("wageLabel");
    const startInput = $("startDate");
    const endInput = $("endDate");
    const reasonInput = $("reason");
    const noticeInput = $("includeNotice");
    const calculateBtn = $("calculateBtn");
    const errorEl = $("sevError");
    const statusEl = $("sevStatus");

    function formatNumber(value) {
        return value.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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
        wageLabel.textContent = isMonthly ? "เงินเดือนอัตราสุดท้าย (บาท/เดือน)" : "ค่าจ้างรายวันอัตราสุดท้าย (บาท/วัน)";
        wageInput.placeholder = isMonthly ? "30000" : "500";
    }

    function updateNoticeState() {
        const enabled = reasonInput.value === "dismissed";
        noticeInput.disabled = !enabled;
        noticeInput.closest("label").style.opacity = enabled ? "1" : ".5";
    }

    function highlightTier(tier) {
        document.querySelectorAll("#sevTable tbody tr").forEach(tr => {
            tr.classList.toggle("active-row", !!tier && tr.dataset.tier === tier.key);
        });
    }

    function runCalculation() {
        clearError();

        const payType = payTypeInput.value;
        const wage = parseFloat(wageInput.value);

        if (isNaN(wage) || wage <= 0) {
            showError(payType === "monthly" ? "กรุณากรอกเงินเดือนให้ถูกต้อง" : "กรุณากรอกค่าจ้างรายวันให้ถูกต้อง");
            return;
        }

        const r = calculateSeverance({
            payType,
            wage,
            startDate: startInput.value,
            endDate: endInput.value,
            reason: reasonInput.value,
            includeNotice: noticeInput.checked
        });

        if (r.error) {
            showError(r.error);
            return;
        }

        $("totalPay").textContent = `${formatNumber(r.total)} บาท`;
        $("serviceText").textContent = `${r.service.years} ปี ${r.service.months} เดือน ${r.service.days} วัน`;
        $("serviceDays").textContent = `${r.service.totalDays.toLocaleString("th-TH")} วัน`;
        $("severanceDays").textContent = `${r.severanceDays} วัน`;
        $("dailyRate").textContent = `${formatNumber(r.dailyRate)} บาท`;
        $("severancePay").textContent = `${formatNumber(r.severancePay)} บาท`;
        $("noticePay").textContent = `${formatNumber(r.noticePay)} บาท`;

        statusEl.style.display = "block";
        statusEl.className = "sev-status " + (r.eligible ? "ok" : "no");
        statusEl.textContent = r.eligible
            ? `✅ มีสิทธิ์ได้ค่าชดเชย ${r.severanceDays} วัน (${r.tier.label})`
            : `⛔ ${r.ineligibleReason}`;

        const nextEl = $("nextMilestone");
        if (r.next && reasonInput.value === "dismissed") {
            nextEl.style.display = "block";
            nextEl.textContent = r.service.totalDays < 120
                ? `ทำงานอีก ${r.next.remainingDays} วัน (ถึงวันที่ ${formatThaiDate(r.next.lastDay)}) จะครบ 120 วันและเริ่มมีสิทธิ์ได้ค่าชดเชย ${r.next.days} วัน`
                : `ทำงานอีก ${r.next.remainingDays.toLocaleString("th-TH")} วัน (ถึงวันที่ ${formatThaiDate(r.next.lastDay)}) จะขึ้นขั้นค่าชดเชยถัดไปเป็น ${r.next.days} วัน`;
        } else {
            nextEl.style.display = "none";
        }

        highlightTier(r.eligible ? r.tier : null);
    }

    payTypeInput.addEventListener("change", updatePayTypeLabels);
    reasonInput.addEventListener("change", updateNoticeState);
    calculateBtn.addEventListener("click", runCalculation);

    [wageInput, startInput, endInput].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") runCalculation();
        });
    });

    updatePayTypeLabels();
    updateNoticeState();
}

if (typeof module !== "undefined") {
    module.exports = { calculateSeverance, calculateService, getSeveranceTier, getNextMilestone, SEVERANCE_TIERS };
}
