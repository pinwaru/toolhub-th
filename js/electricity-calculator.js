// =========================
// เครื่องคำนวณค่าไฟ (บ้านอยู่อาศัย)
// =========================
//
// อัตราอ้างอิง: รอบบิล ก.ย. – ธ.ค. 2569 (มติ กกพ. 5 ส.ค. 2569)
// ถ้า กกพ. ประกาศอัตราใหม่ ให้แก้เฉพาะค่าในบล็อก RATES ด้านล่างนี้
// (แล้วอย่าลืมแก้ข้อความ "รอบบิล" ในหน้า HTML ด้วย)

const RATES = {
    periodLabel: "ก.ย. – ธ.ค. 2569",
    ft: 0.1623,          // ค่า Ft (บาท/หน่วย)
    vat: 0.07,           // ภาษีมูลค่าเพิ่ม 7%
    threshold: 150,      // ใช้ไม่เกิน 150 หน่วย/เดือน = อัตรา 1.1, เกินกว่านั้น = อัตรา 1.2
    "1.1": {
        service: 8.19,
        // upTo = หน่วยสะสมสูงสุดของขั้น (Infinity = ไม่จำกัด)
        tiers: [
            { upTo: 15,       rate: 2.3488 },
            { upTo: 25,       rate: 2.9882 },
            { upTo: 200,      rate: 3.0000 },
            { upTo: 400,      rate: 4.1584 },
            { upTo: Infinity, rate: 4.3583 }
        ]
    },
    "1.2": {
        service: 38.22,
        tiers: [
            { upTo: 200,      rate: 3.0000 },
            { upTo: 400,      rate: 4.1584 },
            { upTo: Infinity, rate: 4.3583 }
        ]
    }
};

// เครื่องใช้ไฟฟ้าที่พบบ่อย (กำลังไฟโดยประมาณ เฉลี่ยขณะใช้งาน)
const APPLIANCE_PRESETS = [
    { name: "แอร์ 9,000 BTU",   watts: 800,  hours: 8 },
    { name: "แอร์ 12,000 BTU",  watts: 1100, hours: 8 },
    { name: "แอร์ 18,000 BTU",  watts: 1600, hours: 8 },
    { name: "ตู้เย็น",           watts: 100,  hours: 24 },
    { name: "พัดลม",            watts: 50,   hours: 8 },
    { name: "หลอดไฟ LED",       watts: 9,    hours: 6 },
    { name: "ทีวี",              watts: 100,  hours: 5 },
    { name: "เครื่องซักผ้า",      watts: 400,  hours: 1 },
    { name: "หม้อหุงข้าว",       watts: 700,  hours: 1 },
    { name: "เครื่องทำน้ำอุ่น",    watts: 3500, hours: 0.5 },
    { name: "คอมพิวเตอร์ตั้งโต๊ะ", watts: 200,  hours: 6 },
    { name: "ไมโครเวฟ",         watts: 1000, hours: 0.3 }
];

// =========================
// Helper
// =========================

const $ = (id) => document.getElementById(id);

function formatNumber(value, digits = 2) {
    return value.toLocaleString("th-TH", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function getFt() {
    const raw = parseFloat($("ftInput").value);
    return isNaN(raw) || raw < -1 || raw > 5 ? RATES.ft : raw;
}

// =========================
// แกนคำนวณบิลค่าไฟ
// =========================

function calcBill(units, ft) {
    const type = units <= RATES.threshold ? "1.1" : "1.2";
    const plan = RATES[type];

    let remaining = units;
    let prev = 0;
    let energy = 0;
    const steps = [];

    for (const tier of plan.tiers) {
        if (remaining <= 0) break;
        const size = tier.upTo === Infinity ? remaining : Math.min(remaining, tier.upTo - prev);
        if (size > 0) {
            const cost = size * tier.rate;
            energy += cost;
            steps.push({
                from: prev + 1,
                to: tier.upTo === Infinity ? null : Math.min(tier.upTo, prev + size),
                units: size,
                rate: tier.rate,
                cost
            });
            remaining -= size;
        }
        prev = tier.upTo;
    }

    const ftCost = units * ft;
    const service = plan.service;
    const subtotal = energy + ftCost + service;
    const vat = subtotal * RATES.vat;
    const total = subtotal + vat;

    return { type, units, energy, ftCost, service, subtotal, vat, total, steps };
}

// หาจำนวนหน่วยจากยอดบิลที่จ่ายจริง (ค้นหาแบบ binary search)
function unitsFromTotal(total, ft) {
    if (total <= calcBill(0, ft).total) return 0;
    let low = 0;
    let high = 20000;
    for (let i = 0; i < 60; i++) {
        const mid = (low + high) / 2;
        if (calcBill(mid, ft).total < total) low = mid; else high = mid;
    }
    return high;
}

// =========================
// แสดงผลบิล
// =========================

function renderBill(bill, targetPrefix) {
    $(targetPrefix + "Total").textContent = formatNumber(bill.total) + " บาท";
    $(targetPrefix + "Units").textContent = formatNumber(bill.units, bill.units % 1 === 0 ? 0 : 1) + " หน่วย";
    $(targetPrefix + "Avg").textContent = formatNumber(bill.units > 0 ? bill.total / bill.units : 0) + " บาท/หน่วย";
    $(targetPrefix + "Type").textContent = "อัตรา " + bill.type;

    const body = $(targetPrefix + "Breakdown");
    const rows = bill.steps.map((s) => {
        const range = s.to === null ? `${formatNumber(s.from, 0)} ขึ้นไป` : `${formatNumber(s.from, 0)} – ${formatNumber(s.to, 0)}`;
        return `<tr><td>หน่วยที่ ${range}</td><td>${formatNumber(s.units, s.units % 1 === 0 ? 0 : 2)}</td><td>${formatNumber(s.rate, 4)}</td><td>${formatNumber(s.cost)}</td></tr>`;
    });
    rows.push(`<tr class="sum-row"><td colspan="3">ค่าพลังงานไฟฟ้ารวม</td><td>${formatNumber(bill.energy)}</td></tr>`);
    rows.push(`<tr><td colspan="3">ค่า Ft (${formatNumber(bill.units, bill.units % 1 === 0 ? 0 : 1)} × ${formatNumber(getFt(), 4)})</td><td>${formatNumber(bill.ftCost)}</td></tr>`);
    rows.push(`<tr><td colspan="3">ค่าบริการรายเดือน</td><td>${formatNumber(bill.service)}</td></tr>`);
    rows.push(`<tr class="sum-row"><td colspan="3">รวมก่อน VAT</td><td>${formatNumber(bill.subtotal)}</td></tr>`);
    rows.push(`<tr><td colspan="3">ภาษีมูลค่าเพิ่ม 7%</td><td>${formatNumber(bill.vat)}</td></tr>`);
    rows.push(`<tr class="total-row"><td colspan="3">ยอดชำระสุทธิ</td><td>${formatNumber(bill.total)}</td></tr>`);
    body.innerHTML = rows.join("");

    $(targetPrefix + "Result").style.display = "block";
}

// =========================
// แท็บ
// =========================

const tabs = document.querySelectorAll(".elec-tab");
const panels = document.querySelectorAll(".elec-panel");

function activateTab(name) {
    tabs.forEach((t) => {
        const on = t.dataset.tab === name;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach((p) => { p.hidden = p.dataset.panel !== name; });
}

tabs.forEach((t) => t.addEventListener("click", () => activateTab(t.dataset.tab)));

// =========================
// โหมด 1: คำนวณจากหน่วยที่ใช้
// =========================

function calculateFromUnits() {
    const units = parseFloat($("unitsInput").value);
    if (isNaN(units) || units <= 0) {
        alert("กรุณากรอกจำนวนหน่วยไฟฟ้าที่มากกว่า 0");
        return;
    }
    if (units > 20000) {
        alert("จำนวนหน่วยสูงเกินไปสำหรับบ้านอยู่อาศัย (สูงสุด 20,000 หน่วย)");
        return;
    }
    renderBill(calcBill(units, getFt()), "u");
}

// =========================
// โหมด 2: จากยอดบิล → หน่วย
// =========================

function calculateFromAmount() {
    const amount = parseFloat($("amountInput").value);
    if (isNaN(amount) || amount <= 0) {
        alert("กรุณากรอกยอดค่าไฟที่มากกว่า 0");
        return;
    }
    const ft = getFt();
    const units = unitsFromTotal(amount, ft);
    if (units <= 0) {
        alert("ยอดที่กรอกน้อยกว่าค่าบริการรายเดือนขั้นต่ำ กรุณาตรวจสอบอีกครั้ง");
        return;
    }
    renderBill(calcBill(units, ft), "a");
}

// =========================
// โหมด 3: รายการเครื่องใช้ไฟฟ้า
// =========================

const applianceBody = $("applianceBody");
let applianceSeq = 0;

function addAppliance(preset) {
    applianceSeq += 1;
    const id = applianceSeq;
    const p = preset || { name: "", watts: "", hours: "" };
    const tr = document.createElement("tr");
    tr.dataset.id = String(id);
    tr.innerHTML = `
        <td data-label="เครื่องใช้ไฟฟ้า"><input type="text" class="ap-name" value="${escapeHtml(p.name)}" placeholder="ชื่อเครื่องใช้" aria-label="ชื่อเครื่องใช้ไฟฟ้า"></td>
        <td data-label="กำลังไฟ (วัตต์)"><input type="number" class="ap-watts" value="${p.watts}" min="0" step="any" placeholder="วัตต์" aria-label="กำลังไฟ วัตต์"></td>
        <td data-label="จำนวน (เครื่อง)"><input type="number" class="ap-qty" value="1" min="1" step="1" aria-label="จำนวนเครื่อง"></td>
        <td data-label="ชม./วัน"><input type="number" class="ap-hours" value="${p.hours}" min="0" max="24" step="any" placeholder="ชม." aria-label="ชั่วโมงต่อวัน"></td>
        <td data-label="วัน/เดือน"><input type="number" class="ap-days" value="30" min="1" max="31" step="1" aria-label="จำนวนวันต่อเดือน"></td>
        <td class="ap-action"><button type="button" class="ap-remove" aria-label="ลบรายการนี้">✕</button></td>
    `;
    applianceBody.appendChild(tr);
}

function buildPresetButtons() {
    const wrap = $("presetWrap");
    APPLIANCE_PRESETS.forEach((preset) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "preset-btn";
        b.textContent = "+ " + preset.name;
        b.addEventListener("click", () => addAppliance(preset));
        wrap.appendChild(b);
    });
}

applianceBody.addEventListener("click", (event) => {
    const btn = event.target.closest(".ap-remove");
    if (btn) btn.closest("tr").remove();
});

function num(row, selector, fallback) {
    const v = parseFloat(row.querySelector(selector).value);
    return isNaN(v) || v < 0 ? fallback : v;
}

function calculateAppliances() {
    const rows = Array.from(applianceBody.querySelectorAll("tr"));
    const items = rows.map((row) => {
        const name = row.querySelector(".ap-name").value.trim() || "เครื่องใช้ไฟฟ้า";
        const watts = num(row, ".ap-watts", 0);
        const qty = Math.max(1, num(row, ".ap-qty", 1));
        const hours = Math.min(24, num(row, ".ap-hours", 0));
        const days = Math.min(31, Math.max(1, num(row, ".ap-days", 30)));
        const kwh = (watts * qty * hours * days) / 1000;
        return { name, kwh };
    }).filter((i) => i.kwh > 0);

    if (items.length === 0) {
        alert("กรุณาเพิ่มเครื่องใช้ไฟฟ้าและกรอกกำลังไฟ (วัตต์) กับชั่วโมงการใช้งานอย่างน้อย 1 รายการ");
        return;
    }

    const totalUnits = items.reduce((s, i) => s + i.kwh, 0);
    const bill = calcBill(totalUnits, getFt());

    // แบ่งค่าไฟตามสัดส่วนหน่วยที่ใช้ของแต่ละเครื่อง
    items.sort((a, b) => b.kwh - a.kwh);
    const maxKwh = items[0].kwh;
    $("shareBody").innerHTML = items.map((i) => {
        const share = i.kwh / totalUnits;
        const cost = bill.total * share;
        const width = Math.max(3, Math.round((i.kwh / maxKwh) * 100));
        return `<tr>
            <td>${escapeHtml(i.name)}</td>
            <td>${formatNumber(i.kwh, 1)}</td>
            <td>${formatNumber(share * 100, 1)}%</td>
            <td>${formatNumber(cost)}</td>
            <td class="bar-cell"><span class="bar" style="width:${width}%"></span></td>
        </tr>`;
    }).join("");

    $("yearEstimate").textContent = formatNumber(bill.total * 12, 0) + " บาท";
    renderBill(bill, "p");
}

// =========================
// Events
// =========================

$("unitsBtn").addEventListener("click", calculateFromUnits);
$("amountBtn").addEventListener("click", calculateFromAmount);
$("applianceBtn").addEventListener("click", calculateAppliances);
$("addApplianceBtn").addEventListener("click", () => addAppliance());

$("unitsInput").addEventListener("keydown", (e) => { if (e.key === "Enter") calculateFromUnits(); });
$("amountInput").addEventListener("keydown", (e) => { if (e.key === "Enter") calculateFromAmount(); });

buildPresetButtons();
addAppliance(APPLIANCE_PRESETS[1]);
addAppliance(APPLIANCE_PRESETS[3]);
addAppliance(APPLIANCE_PRESETS[4]);
