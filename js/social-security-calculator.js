// =========================
// ค่าคงที่ประกันสังคม (ปรับล่าสุดตามกฎกระทรวงฐานค่าจ้าง ม.33 มีผล 1 ม.ค. 2569)
// =========================

const SSO_RATE = 0.05;        // อัตราเงินสมทบ ม.33 (ผู้ประกันตน 5% + นายจ้าง 5%)
const SSO_MIN_BASE = 1650;    // ฐานค่าจ้างขั้นต่ำ

// ฐานค่าจ้างขั้นสูงของ ม.33 แยกตามช่วงเวลา
const CEILING_PERIODS = [
    { key: "p1", label: "ม.ค. 2569 – ธ.ค. 2571", max: 17500 },
    { key: "p2", label: "ม.ค. 2572 – ธ.ค. 2574", max: 20000 },
    { key: "p3", label: "ม.ค. 2575 เป็นต้นไป",    max: 23000 }
];

// เงินสมทบคงที่ของ ม.39 และ ม.40 (บาท/เดือน)
const FIXED_CONTRIBUTIONS = {
    s39:  { label: "มาตรา 39", amount: 432 },
    s40a: { label: "มาตรา 40 ทางเลือกที่ 1", amount: 70 },
    s40b: { label: "มาตรา 40 ทางเลือกที่ 2", amount: 100 },
    s40c: { label: "มาตรา 40 ทางเลือกที่ 3", amount: 300 }
};

// บำนาญชราภาพ (ม.33 และ ม.39)
const PENSION_MIN_MONTHS = 180;     // ส่งสมทบครบ 180 เดือน (15 ปี)
const PENSION_BASE_RATE = 0.20;     // 20% ของค่าจ้างเฉลี่ย 60 เดือนสุดท้าย
const PENSION_EXTRA_RATE = 0.015;   // เพิ่ม 1.5% ต่อทุก 12 เดือนที่เกิน 180 เดือน
const PENSION_EXTRA_BLOCK = 12;
const PENSION_WAGE_CAP = { s33: 17500, s39: 4800 };

// =========================
// คำนวณเงินสมทบ
// =========================

function calculateContribution(input) {
    const { type, salary, periodKey } = input;

    if (type !== "s33") {
        const fixed = FIXED_CONTRIBUTIONS[type];
        if (!fixed) return { error: "ไม่พบประเภทผู้ประกันตนที่เลือก" };
        return {
            type,
            label: fixed.label,
            monthly: fixed.amount,
            yearly: fixed.amount * 12,
            fixed: true
        };
    }

    const period = CEILING_PERIODS.find(p => p.key === periodKey);
    if (!period) return { error: "ไม่พบช่วงเวลาที่เลือก" };
    if (!(salary > 0)) return { error: "กรุณากรอกเงินเดือนให้ถูกต้อง" };

    const base = Math.min(Math.max(salary, SSO_MIN_BASE), period.max);
    const employee = base * SSO_RATE;

    return {
        type,
        label: "มาตรา 33",
        base,
        capped: salary > period.max,
        floored: salary < SSO_MIN_BASE,
        ceiling: period.max,
        periodLabel: period.label,
        monthly: employee,
        employer: employee,
        yearly: employee * 12,
        netSalary: salary - employee,
        fixed: false
    };
}

// =========================
// คำนวณบำนาญชราภาพ
// =========================

function calculatePension(input) {
    const { type, avgWage, totalMonths } = input;

    if (!(avgWage > 0)) return { error: "กรุณากรอกค่าจ้างเฉลี่ยให้ถูกต้อง" };
    if (!Number.isFinite(totalMonths) || totalMonths <= 0) return { error: "กรุณากรอกระยะเวลาที่ส่งเงินสมทบ" };

    const cap = PENSION_WAGE_CAP[type];
    if (!cap) return { error: "ไม่พบประเภทผู้ประกันตนที่เลือก" };

    const wage = Math.min(avgWage, cap);
    const eligible = totalMonths >= PENSION_MIN_MONTHS;

    if (!eligible) {
        return {
            eligible: false,
            wage,
            capped: avgWage > cap,
            cap,
            totalMonths,
            monthsToGo: PENSION_MIN_MONTHS - totalMonths
        };
    }

    const extraBlocks = Math.floor((totalMonths - PENSION_MIN_MONTHS) / PENSION_EXTRA_BLOCK);
    const rate = PENSION_BASE_RATE + PENSION_EXTRA_RATE * extraBlocks;
    const monthly = wage * rate;
    const monthsToNextBlock = PENSION_EXTRA_BLOCK - ((totalMonths - PENSION_MIN_MONTHS) % PENSION_EXTRA_BLOCK);

    return {
        eligible: true,
        wage,
        capped: avgWage > cap,
        cap,
        totalMonths,
        extraBlocks,
        rate,
        monthly,
        yearly: monthly * 12,
        monthsToNextBlock
    };
}

// =========================
// ส่วนแสดงผล (ทำงานเฉพาะในเบราว์เซอร์)
// =========================

if (typeof document !== "undefined") {

    const $ = id => document.getElementById(id);

    const modeInput = $("mode");
    const typeInput = $("type");
    const salaryInput = $("salary");
    const periodInput = $("period");
    const pTypeInput = $("pType");
    const avgWageInput = $("avgWage");
    const yearsInput = $("yearsPaid");
    const monthsInput = $("monthsPaid");
    const errorEl = $("ssoError");

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

    function updateVisibility() {
        const isContribution = modeInput.value === "contribution";
        $("contribGroup").style.display = isContribution ? "block" : "none";
        $("pensionGroup").style.display = isContribution ? "none" : "block";

        const isS33 = typeInput.value === "s33";
        $("salaryWrap").style.display = isS33 ? "block" : "none";
        $("periodWrap").style.display = isS33 ? "block" : "none";

        $("contribResult").style.display = "none";
        $("pensionResult").style.display = "none";
        clearError();
    }

    function runContribution() {
        const r = calculateContribution({
            type: typeInput.value,
            salary: parseFloat(salaryInput.value),
            periodKey: periodInput.value
        });
        if (r.error) { showError(r.error); return; }

        $("cTitle").textContent = `เงินสมทบ${r.label}ที่คุณต้องจ่าย`;
        $("cMonthly").textContent = `${formatNumber(r.monthly)} บาท / เดือน`;
        $("cYearly").textContent = `${formatNumber(r.yearly)} บาท`;

        const s33Items = document.querySelectorAll(".s33-only");
        s33Items.forEach(el => { el.style.display = r.fixed ? "none" : "block"; });

        const noteEl = $("cNote");
        if (r.fixed) {
            noteEl.style.display = "none";
        } else {
            $("cBase").textContent = `${formatNumber(r.base)} บาท`;
            $("cEmployer").textContent = `${formatNumber(r.employer)} บาท`;
            $("cNet").textContent = `${formatNumber(r.netSalary)} บาท`;

            let note = "";
            if (r.capped) {
                note = `เงินเดือนสูงกว่าเพดานฐานค่าจ้าง จึงคิดจากฐานสูงสุด ${formatNumber(r.ceiling)} บาท (ช่วง ${r.periodLabel})`;
            } else if (r.floored) {
                note = `เงินเดือนต่ำกว่าฐานขั้นต่ำ จึงคิดจากฐาน ${formatNumber(SSO_MIN_BASE)} บาท`;
            }
            noteEl.textContent = note;
            noteEl.style.display = note ? "block" : "none";
        }

        $("contribResult").style.display = "block";
        $("pensionResult").style.display = "none";
    }

    function runPension() {
        const years = parseInt(yearsInput.value || "0", 10);
        const months = parseInt(monthsInput.value || "0", 10);
        if (years < 0 || months < 0 || isNaN(years) || isNaN(months)) {
            showError("ระยะเวลาที่ส่งเงินสมทบต้องไม่ติดลบ");
            return;
        }

        const r = calculatePension({
            type: pTypeInput.value,
            avgWage: parseFloat(avgWageInput.value),
            totalMonths: years * 12 + months
        });
        if (r.error) { showError(r.error); return; }

        const statusEl = $("pStatus");
        const nextEl = $("pNext");
        $("pMonths").textContent = `${r.totalMonths} เดือน`;
        $("pWage").textContent = `${formatNumber(r.wage)} บาท`;

        if (!r.eligible) {
            $("pMain").textContent = "ยังไม่เข้าเกณฑ์บำนาญ";
            $("pRate").textContent = "-";
            $("pYearly").textContent = "-";
            statusEl.className = "sso-status no";
            statusEl.textContent = `⛔ ส่งเงินสมทบ ${r.totalMonths} เดือน ยังไม่ครบ 180 เดือน (15 ปี) หากสิ้นสุดความเป็นผู้ประกันตนตอนนี้จะได้รับเป็นเงินบำเหน็จก้อนเดียว ไม่ใช่บำนาญรายเดือน`;
            nextEl.textContent = `ส่งเงินสมทบอีก ${r.monthsToGo} เดือน จึงจะครบเกณฑ์บำนาญ`;
        } else {
            $("pMain").textContent = `${formatNumber(r.monthly)} บาท / เดือน`;
            $("pRate").textContent = `${(r.rate * 100).toFixed(1)}%`;
            $("pYearly").textContent = `${formatNumber(r.yearly)} บาท`;
            statusEl.className = "sso-status ok";
            statusEl.textContent = `✅ เข้าเกณฑ์รับบำนาญชราภาพ (เมื่ออายุครบ 55 ปีและสิ้นสุดความเป็นผู้ประกันตน)`;
            nextEl.textContent = `ส่งเงินสมทบต่ออีก ${r.monthsToNextBlock} เดือน อัตราบำนาญจะเพิ่มอีก 1.5%`;
        }

        const noteEl = $("pNote");
        if (r.capped) {
            noteEl.textContent = `ค่าจ้างที่กรอกสูงกว่าเพดาน จึงคิดจากฐานสูงสุด ${formatNumber(r.cap)} บาท`;
            noteEl.style.display = "block";
        } else {
            noteEl.style.display = "none";
        }

        $("pensionResult").style.display = "block";
        $("contribResult").style.display = "none";
    }

    function runCalculation() {
        clearError();
        if (modeInput.value === "contribution") runContribution();
        else runPension();
    }

    modeInput.addEventListener("change", updateVisibility);
    typeInput.addEventListener("change", updateVisibility);
    $("calculateBtn").addEventListener("click", runCalculation);

    [salaryInput, avgWageInput, yearsInput, monthsInput].forEach(input => {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") runCalculation();
        });
    });

    updateVisibility();
}

if (typeof module !== "undefined") {
    module.exports = { calculateContribution, calculatePension, CEILING_PERIODS, FIXED_CONTRIBUTIONS };
}
