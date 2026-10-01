// =========================
// Elements
// =========================

const originalPriceInput = document.getElementById("originalPrice");
const discount1Input = document.getElementById("discount1");
const discount2Input = document.getElementById("discount2");

const calculateBtn = document.getElementById("calculateBtn");

const finalPriceEl = document.getElementById("finalPrice");
const originalPriceResultEl = document.getElementById("originalPriceResult");
const totalSavedEl = document.getElementById("totalSaved");
const effectiveDiscountEl = document.getElementById("effectiveDiscount");

const breakdownSection = document.getElementById("breakdownSection");
const breakdownBody = document.querySelector("#breakdownTable tbody");

// =========================
// Helper: จัดรูปแบบตัวเลข
// =========================

function formatNumber(value) {
    return value.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function clampPercent(value) {
    if (isNaN(value) || value < 0) return 0;
    if (value > 100) return 100;
    return value;
}

// =========================
// คำนวณส่วนลด (รองรับส่วนลดซ้อนสูงสุด 2 ชั้น)
// =========================

function calculateDiscount() {

    const originalPrice = parseFloat(originalPriceInput.value);

    if (isNaN(originalPrice) || originalPrice <= 0) {
        alert("กรุณากรอกราคาสินค้าที่มากกว่า 0");
        return;
    }

    const discount1 = clampPercent(parseFloat(discount1Input.value) || 0);
    const discount2 = clampPercent(parseFloat(discount2Input.value) || 0);

    const priceAfterDiscount1 = originalPrice * (1 - discount1 / 100);
    const discount1Amount = originalPrice - priceAfterDiscount1;

    const priceAfterDiscount2 = priceAfterDiscount1 * (1 - discount2 / 100);
    const discount2Amount = priceAfterDiscount1 - priceAfterDiscount2;

    const finalPrice = priceAfterDiscount2;
    const totalSaved = originalPrice - finalPrice;
    const effectiveDiscount = (totalSaved / originalPrice) * 100;

    finalPriceEl.textContent = formatNumber(finalPrice) + " บาท";
    originalPriceResultEl.textContent = formatNumber(originalPrice) + " บาท";
    totalSavedEl.textContent = formatNumber(totalSaved) + " บาท";
    effectiveDiscountEl.textContent = effectiveDiscount.toFixed(2) + "%";

    renderBreakdown(originalPrice, discount1, discount1Amount, priceAfterDiscount1, discount2, discount2Amount, priceAfterDiscount2);
}

// =========================
// แสดงขั้นตอนการคำนวณ
// =========================

function renderBreakdown(originalPrice, discount1, discount1Amount, priceAfterDiscount1, discount2, discount2Amount, priceAfterDiscount2) {

    breakdownBody.innerHTML = "";

    const fragment = document.createDocumentFragment();

    const row1 = document.createElement("tr");
    row1.innerHTML = `
        <td>ลดครั้งที่ 1 (${discount1}%)</td>
        <td>${formatNumber(originalPrice)} บาท</td>
        <td>-${formatNumber(discount1Amount)} บาท</td>
        <td>${formatNumber(priceAfterDiscount1)} บาท</td>
    `;
    fragment.appendChild(row1);

    if (discount2 > 0) {
        const row2 = document.createElement("tr");
        row2.innerHTML = `
            <td>ลดซ้อนครั้งที่ 2 (${discount2}%)</td>
            <td>${formatNumber(priceAfterDiscount1)} บาท</td>
            <td>-${formatNumber(discount2Amount)} บาท</td>
            <td>${formatNumber(priceAfterDiscount2)} บาท</td>
        `;
        fragment.appendChild(row2);
    }

    breakdownBody.appendChild(fragment);
    breakdownSection.style.display = "block";
}

// =========================
// ปุ่มคำนวณ / กด Enter
// =========================

calculateBtn.addEventListener("click", calculateDiscount);

[originalPriceInput, discount1Input, discount2Input].forEach(input => {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            calculateDiscount();
        }
    });
});
