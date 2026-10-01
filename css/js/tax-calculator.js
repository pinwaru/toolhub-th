// =========================
// ค่าคงที่ตามเกณฑ์ปีภาษี 2568 (ยื่นปี 2569)
// =========================

const TAX_BRACKETS = [
    { min: 0,        max: 150000,   rate: 0    },
    { min: 150000,   max: 300000,   rate: 0.05 },
    { min: 300000,   max: 500000,   rate: 0.10 },
    { min: 500000,   max: 750000,   rate: 0.15 },
    { min: 750000,   max: 1000000,  rate: 0.20 },
    { min: 1000000,  max: 2000000,  rate: 0.25 },
    { min: 2000000,  max: 5000000,  rate: 0.30 },
    { min: 5000000,  max: Infinity, rate: 0.35 }
];

const PERSONAL_ALLOWANCE = 60000;   // ค่าลดหย่อนส่วนตัว
const MAX_EXPENSE_DEDUCTION = 100000; // ค่าใช้จ่ายสูงสุด (เงินเดือน)
const SSO_RATE = 0.05;              // อัตราประกันสังคม
const SSO_MAX_BASE_MONTHLY = 15000; // ฐานเงินเดือนสูงสุดที่คิดประกันสังคม
const SSO_MAX_MONTHLY = 750;        // เพดานประกันสังคมต่อเดือน
const SSO_MAX_YEARLY = 9000;        // เพดานประกันสังคมต่อปี

// =========================
// Elements
// =========================

const monthlySalaryInput = document.getElementById("monthlySalary");
const bonusInput = document.getElementById("bonus");
const otherDeductionInput = document.getElementById("otherDeduction");
const includeSsoInput = document.getElementById("includeSso");

const calculateBtn = document.getElementById("calculateBtn");

const annualIncomeEl = document.getElementById("annualIncome");
const totalDeductionEl = document.getElementById("totalDeduction");
const netIncomeEl = document.getElementById("netIncome");
const yearlyTaxEl = document.getElementById("yearlyTax");
const monthlyTaxEl = document.getElementById("monthlyTax");
const netSalaryEl = document.getElementById("netSalary");

const scheduleBody = document.querySelector("#scheduleTable tbody");

// =========================
// จัดรูปแบบตัวเลข
// =========================

function formatNumber(value) {
    return value.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// =========================
// คำนวณประกันสังคมต่อปี
// =========================

function calculateSso(monthlySalary) {
    const base = Math.min(monthlySalary, SSO_MAX_BASE_MONTHLY);
    const monthly = Math.min(base * SSO_RATE, SSO_MAX_MONTHLY);
    return Math.min(monthly * 12, SSO_MAX_YEARLY);
}

// =========================
// คำนวณภาษีขั้นบันได
// =========================

function calculateProgressiveTax(netIncome) {
    let tax = 0;
    const breakdown = [];

    for (const bracket of TAX_BRACKETS) {
        if (netIncome <= bracket.min) {
            breakdown.push({ ...bracket, taxable: 0, taxPaid: 0 });
            continue;
        }

        const taxableInThisBracket = Math.min(netIncome, bracket.max) - bracket.min;
        const taxPaid = taxableInThisBracket * bracket.rate;

        tax += taxPaid;

        breakdown.push({ ...bracket, taxable: taxableInThisBracket, taxPaid });
    }

    return { tax, breakdown };
}

// =========================
// คำนวณภาษีเงินเดือนสุทธิ
// =========================

function calculateTax() {
    const monthlySalary = parseFloat(monthlySalaryInput.value);
    const bonus = parseFloat(bonusInput.value) || 0;
    const otherDeduction = parseFloat(otherDeductionInput.value) || 0;
    const includeSso = includeSsoInput.checked;

    if (isNaN(monthlySalary) || monthlySalary <= 0) {
        alert("กรุณากรอกเงินเดือนให้ถูกต้อง");
        return;
    }

    const annualIncome = monthlySalary * 12 + bonus;

    const sso = includeSso ? calculateSso(monthlySalary) : 0;

    const expenseDeduction = Math.min(annualIncome * 0.5, MAX_EXPENSE_DEDUCTION);

    const totalDeduction = PERSONAL_ALLOWANCE + sso + otherDeduction;

    const netIncome = Math.max(annualIncome - expenseDeduction - totalDeduction, 0);

    const { tax, breakdown } = calculateProgressiveTax(netIncome);

    const monthlyTax = tax / 12;
    const netSalary = monthlySalary - (sso / 12) - monthlyTax;

    annualIncomeEl.textContent = `${formatNumber(annualIncome)} บาท`;
    totalDeductionEl.textContent = `${formatNumber(expenseDeduction + totalDeduction)} บาท`;
    netIncomeEl.textContent = `${formatNumber(netIncome)} บาท`;
    yearlyTaxEl.textContent = `${formatNumber(tax)} บาท`;
    monthlyTaxEl.textContent = `${formatNumber(monthlyTax)} บาท`;
    netSalaryEl.textContent = `${formatNumber(netSalary)} บาท / เดือน`;

    if (!scheduleBody) return;

    scheduleBody.innerHTML = "";

    const fragment = document.createDocumentFragment();

    breakdown.forEach(b => {
        const row = document.createElement("tr");

        const maxLabel = b.max === Infinity ? "ขึ้นไป" : formatNumber(b.max);

        row.innerHTML = `
            <td>${formatNumber(b.min)} - ${maxLabel}</td>
            <td>${(b.rate * 100).toFixed(0)}%</td>
            <td>${formatNumber(b.taxable)}</td>
            <td>${formatNumber(b.taxPaid)}</td>
        `;

        if (b.taxable > 0) {
            row.classList.add("active-bracket");
        }

        fragment.appendChild(row);
    });

    scheduleBody.appendChild(fragment);
}

// =========================
// ปุ่มคำนวณ
// =========================

calculateBtn.addEventListener("click", calculateTax);

// =========================
// กด Enter เพื่อคำนวณ
// =========================

[monthlySalaryInput, bonusInput, otherDeductionInput].forEach(input => {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            calculateTax();
        }
    });
});
