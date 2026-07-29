const loanAmount = document.getElementById("loanAmount");
const interestRate = document.getElementById("interestRate");
const loanYears = document.getElementById("loanYears");

const calculateBtn = document.getElementById("calculateBtn");

const monthlyPayment = document.getElementById("monthlyPayment");
const totalPayment = document.getElementById("totalPayment");
const totalInterest = document.getElementById("totalInterest");

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
// คำนวณเงินกู้
// =========================

function calculateLoan() {

    const principal = parseFloat(loanAmount.value);

    const annualRate = parseFloat(interestRate.value);

    const years = parseFloat(loanYears.value);

    if (

        isNaN(principal) ||

        isNaN(annualRate) ||

        isNaN(years) ||

        principal <= 0 ||

        annualRate < 0 ||

        years <= 0

    ) {

        alert("กรุณากรอกข้อมูลให้ถูกต้อง");

        return;

    }

    const monthlyRate = annualRate / 100 / 12;

    const numberOfPayments = Math.round(years * 12);

    let monthly;

    if (monthlyRate === 0) {

        monthly = principal / numberOfPayments;

    } else {

        monthly =

            principal *

            monthlyRate *

            Math.pow(1 + monthlyRate, numberOfPayments) /

            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    }

    const total = monthly * numberOfPayments;

    const interest = total - principal;

    monthlyPayment.textContent = `${formatNumber(monthly)} บาท`;

    totalPayment.textContent = `${formatNumber(total)} บาท`;

    totalInterest.textContent = `${formatNumber(interest)} บาท`;

    if (!scheduleBody) return;

    scheduleBody.innerHTML = "";

    let balance = principal;

    const fragment = document.createDocumentFragment();

    for (let month = 1; month <= numberOfPayments; month++) {

        let interestPaid;

        let principalPaid;

        if (monthlyRate === 0) {

            interestPaid = 0;

            principalPaid = monthly;

        } else {

            interestPaid = balance * monthlyRate;

            principalPaid = monthly - interestPaid;

        }

        balance -= principalPaid;

        if (balance < 0) {

            balance = 0;

        }

        const row = document.createElement("tr");

            row.innerHTML = `

            <td>${month}</td>

            <td>${formatNumber(principalPaid)}</td>

            <td>${formatNumber(interestPaid)}</td>

            <td>${formatNumber(balance)}</td>

        `;

        // ไฮไลต์งวดสุดท้าย
        if (month === numberOfPayments) {

            row.classList.add("last-payment");

        }

        fragment.appendChild(row);

    }

    // เพิ่มข้อมูลเข้าตารางครั้งเดียว (Performance ดีกว่า)
    scheduleBody.appendChild(fragment);

}

// =========================
// ปุ่มคำนวณ
// =========================

calculateBtn.addEventListener("click", calculateLoan);

// =========================
// กด Enter เพื่อคำนวณ
// =========================

[loanAmount, interestRate, loanYears].forEach(input => {

    input.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {

            calculateLoan();

        }

    });

});
