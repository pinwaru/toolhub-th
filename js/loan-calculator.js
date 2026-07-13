const loanAmount = document.getElementById("loanAmount");
const interestRate = document.getElementById("interestRate");
const loanYears = document.getElementById("loanYears");

const calculateBtn = document.getElementById("calculateBtn");

const monthlyPayment = document.getElementById("monthlyPayment");
const totalPayment = document.getElementById("totalPayment");
const totalInterest = document.getElementById("totalInterest");

// ตรวจสอบว่ามีตารางหรือไม่
const scheduleBody = document.querySelector("#scheduleTable tbody");

calculateBtn.addEventListener("click", () => {

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

    monthlyPayment.textContent =
        monthly.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " บาท";

    totalPayment.textContent =
        total.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " บาท";

    totalInterest.textContent =
        interest.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " บาท";

    // ======================
    // ตารางผ่อนชำระ
    // ======================

    // ถ้าไม่มีตารางก็ไม่ต้องสร้าง
    if (!scheduleBody) return;

    scheduleBody.innerHTML = "";

    let balance = principal;

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

        if (balance < 0) balance = 0;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${month}</td>
            <td>${principalPaid.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</td>
            <td>${interestPaid.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</td>
            <td>${balance.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</td>
        `;

        scheduleBody.appendChild(row);

    }

});
