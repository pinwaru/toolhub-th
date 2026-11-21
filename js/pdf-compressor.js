// =========================
// บีบอัดไฟล์ PDF (ประมวลผลในเบราว์เซอร์ ด้วย pdf.js + pdf-lib)
// โหมด image: เรนเดอร์ทุกหน้าเป็นรูป JPEG แล้วประกอบเป็น PDF ใหม่ (เล็กมาก แต่ข้อความเลือกไม่ได้)
// โหมด light: บันทึก PDF ใหม่แบบ object streams (คงข้อความ ลดได้น้อย)
// =========================

const LIBS = {
    pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    pdflib: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"
};

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_PAGES_IMAGE = 200;
const MAX_CANVAS_SIDE = 4000;

// dpi = ความละเอียดตอนเรนเดอร์หน้า, q = คุณภาพ JPEG
const LEVELS = {
    small: { dpi: 96, q: 0.55 },
    balanced: { dpi: 130, q: 0.7 },
    sharp: { dpi: 170, q: 0.82 }
};

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileCard = document.getElementById("fileCard");
const fileNameEl = document.getElementById("fileName");
const fileMetaEl = document.getElementById("fileMeta");
const changeBtn = document.getElementById("changeBtn");
const optionsSection = document.getElementById("optionsSection");
const levelRow = document.getElementById("levelRow");
const modeNote = document.getElementById("modeNote");
const compressBtn = document.getElementById("compressBtn");
const cancelBtn = document.getElementById("cancelBtn");
const statusEl = document.getElementById("status");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const resultEl = document.getElementById("result");

const state = {
    file: null,
    pages: 0,
    mode: "image",
    level: "balanced",
    busy: false,
    cancel: false,
    url: null
};

// =========================
// Helpers
// =========================

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (type ? " " + type : "");
}

function setProgress(p) {
    if (p == null) {
        progressWrap.style.display = "none";
        progressBar.style.width = "0%";
        return;
    }
    progressWrap.style.display = "block";
    progressBar.style.width = Math.round(p * 100) + "%";
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const loaded = {};

function loadScript(src) {
    if (!loaded[src]) {
        loaded[src] = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = src;
            s.onload = resolve;
            s.onerror = () => { delete loaded[src]; reject(new Error("โหลดไลบรารีไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่")); };
            document.head.appendChild(s);
        });
    }
    return loaded[src];
}

async function ensurePdfJs() {
    await loadScript(LIBS.pdfjs);
    pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.worker;
}

async function ensurePdfLib() {
    await loadScript(LIBS.pdflib);
}

function isPdf(file) {
    return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function tick() {
    return new Promise(r => setTimeout(r, 0));
}

function friendlyError(err) {
    const name = err && err.name;
    const msg = (err && err.message) || "";
    if (name === "PasswordException" || /encrypt|password/i.test(name + msg)) {
        return "ไฟล์ PDF นี้มีรหัสผ่านหรือถูกเข้ารหัส เครื่องมือนี้ยังไม่รองรับ";
    }
    if (name === "InvalidPDFException" || /Invalid PDF|No PDF header/i.test(msg)) {
        return "ไฟล์ PDF เสียหายหรืออ่านไม่ได้";
    }
    if (name === "MissingPDFException") return "ไม่พบไฟล์ PDF";
    return msg || "เกิดข้อผิดพลาด กรุณาลองใหม่";
}

// =========================
// Options
// =========================

document.querySelectorAll('[data-group="mode"] button').forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll('[data-group="mode"] button').forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.mode = btn.dataset.value;
        syncModeUi();
    });
});

document.querySelectorAll('[data-group="level"] button').forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll('[data-group="level"] button').forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.level = btn.dataset.value;
    });
});

function syncModeUi() {
    const image = state.mode === "image";
    levelRow.style.display = image ? "" : "none";
    modeNote.textContent = image
        ? "ลดขนาดได้มาก เหมาะกับไฟล์สแกนหรือไฟล์ที่เต็มไปด้วยรูป ข้อความในไฟล์ใหม่จะเลือก/คัดลอก/ค้นหาไม่ได้ (กลายเป็นภาพ)"
        : "คงข้อความและฟอนต์เดิมไว้ทั้งหมด แต่ลดขนาดได้น้อย บางไฟล์อาจไม่เล็กลงเลย";
}

// =========================
// File selection
// =========================

dropZone.addEventListener("click", () => fileInput.click());
changeBtn.addEventListener("click", () => { if (!state.busy) fileInput.click(); });

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files[0]) selectFile(fileInput.files[0]);
    fileInput.value = "";
});

async function selectFile(file) {
    if (state.busy) return;
    clearResult();

    if (!isPdf(file)) {
        setStatus("กรุณาเลือกไฟล์ PDF เท่านั้น", "error");
        return;
    }
    if (file.size > MAX_BYTES) {
        setStatus(`ไฟล์ใหญ่เกินไป (${formatBytes(file.size)}) รองรับสูงสุด ${formatBytes(MAX_BYTES)}`, "error");
        return;
    }

    state.file = file;
    state.pages = 0;
    compressBtn.disabled = true;
    dropZone.style.display = "none";
    fileCard.style.display = "flex";
    fileNameEl.textContent = file.name;
    fileMetaEl.textContent = `${formatBytes(file.size)} • กำลังอ่านไฟล์...`;
    optionsSection.style.display = "none";
    setStatus("");

    try {
        await ensurePdfJs();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        state.pages = pdf.numPages;
        pdf.destroy();
        fileMetaEl.textContent = `${formatBytes(file.size)} • ${state.pages} หน้า`;
        optionsSection.style.display = "";
        syncModeUi();
        compressBtn.disabled = false;
    } catch (err) {
        fileMetaEl.textContent = formatBytes(file.size);
        setStatus(friendlyError(err), "error");
        state.file = null;
        dropZone.style.display = "";
        fileCard.style.display = "none";
    }
}

function clearResult() {
    if (state.url) {
        URL.revokeObjectURL(state.url);
        state.url = null;
    }
    resultEl.style.display = "none";
    resultEl.innerHTML = "";
    setProgress(null);
}

// =========================
// Compress
// =========================

async function compressImageMode(buf, level) {
    await ensurePdfJs();
    await ensurePdfLib();

    const { PDFDocument } = PDFLib;
    const preset = LEVELS[level] || LEVELS.balanced;
    const pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
    const total = pdf.numPages;

    if (total > MAX_PAGES_IMAGE) {
        pdf.destroy();
        throw new Error(`โหมดนี้รองรับสูงสุด ${MAX_PAGES_IMAGE} หน้า (ไฟล์นี้มี ${total} หน้า) ลองโหมด "คงข้อความ" หรือแยกไฟล์ก่อน`);
    }

    const out = await PDFDocument.create();

    for (let i = 1; i <= total; i++) {
        if (state.cancel) { pdf.destroy(); throw new Error("__cancel__"); }

        const page = await pdf.getPage(i);
        const base = page.getViewport({ scale: 1 });
        let scale = preset.dpi / 72;
        scale = Math.min(scale, MAX_CANVAS_SIDE / Math.max(base.width, base.height));
        const vp = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(vp.width));
        canvas.height = Math.max(1, Math.ceil(vp.height));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", preset.q));
        if (!blob) throw new Error("แปลงหน้าเป็นรูปไม่สำเร็จ (หน่วยความจำอาจไม่พอ) ลองเลือกระดับ \"เล็กสุด\"");
        const jpg = await out.embedJpg(await blob.arrayBuffer());

        const outPage = out.addPage([base.width, base.height]);
        outPage.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });

        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();

        setProgress(i / total);
        setStatus(`กำลังบีบอัดหน้า ${i} / ${total}`);
        await tick();
    }

    pdf.destroy();
    out.setProducer("ToolHub TH");
    out.setCreator("ToolHub TH");
    return await out.save();
}

async function compressLightMode(buf) {
    await ensurePdfLib();
    const { PDFDocument } = PDFLib;
    setStatus("กำลังจัดเรียงโครงสร้างไฟล์ใหม่...");
    setProgress(0.4);
    await tick();
    const doc = await PDFDocument.load(buf, { updateMetadata: false });
    doc.setProducer("ToolHub TH");
    doc.setCreator("ToolHub TH");
    const bytes = await doc.save({ useObjectStreams: true });
    setProgress(1);
    return bytes;
}

compressBtn.addEventListener("click", async () => {
    if (!state.file || state.busy) return;

    state.busy = true;
    state.cancel = false;
    compressBtn.disabled = true;
    changeBtn.disabled = true;
    cancelBtn.style.display = state.mode === "image" ? "" : "none";
    clearResult();
    setStatus("เริ่มประมวลผล...");
    setProgress(0);

    try {
        const buf = await state.file.arrayBuffer();
        const bytes = state.mode === "image"
            ? await compressImageMode(buf, state.level)
            : await compressLightMode(buf);

        const blob = new Blob([bytes], { type: "application/pdf" });
        showResult(blob);
    } catch (err) {
        setProgress(null);
        if (err && err.message === "__cancel__") {
            setStatus("ยกเลิกแล้ว", "error");
        } else {
            setStatus(friendlyError(err), "error");
        }
    } finally {
        state.busy = false;
        compressBtn.disabled = false;
        changeBtn.disabled = false;
        cancelBtn.style.display = "none";
    }
});

cancelBtn.addEventListener("click", () => {
    state.cancel = true;
    setStatus("กำลังยกเลิก...");
});

function showResult(blob) {
    const before = state.file.size;
    const after = blob.size;
    const saved = before - after;
    const pct = (saved / before) * 100;
    const meaningful = pct >= 2;

    state.url = URL.createObjectURL(blob);
    const baseName = state.file.name.replace(/\.pdf$/i, "");
    const downloadName = `${baseName}-compressed.pdf`;

    setProgress(null);
    setStatus("");

    let verdict;
    if (meaningful) {
        verdict = `ลดลง ${pct.toFixed(1)}% (${formatBytes(saved)})`;
    } else if (saved > 0) {
        verdict = `แทบไม่เล็กลง (ลดลงเพียง ${pct.toFixed(1)}%)`;
    } else {
        verdict = "ไม่เล็กลง";
    }

    const hint = meaningful
        ? ""
        : `<p>ไฟล์ใหม่แทบไม่เล็กกว่าไฟล์เดิม ${state.mode === "light" ? 'ลองโหมด "ลดขนาดมาก" ' : 'ลองระดับ "เล็กสุด" หรือใช้ไฟล์เดิมต่อไป '}ถ้าไฟล์ส่วนใหญ่เป็นข้อความล้วน การบีบอัดอาจไม่ช่วยมากนัก</p>`;

    const note = state.mode === "image" && saved > 0
        ? "<p>หมายเหตุ: ข้อความในไฟล์ใหม่เป็นภาพ จึงเลือก คัดลอก หรือค้นหาไม่ได้ ควรเก็บไฟล์ต้นฉบับไว้</p>"
        : "";

    resultEl.innerHTML = `
<h2>ผลการบีบอัด</h2>
<table>
<tr><th>ไฟล์</th><td>${escapeHtml(state.file.name)}</td></tr>
<tr><th>ขนาดเดิม</th><td>${formatBytes(before)}</td></tr>
<tr><th>ขนาดใหม่</th><td><strong>${formatBytes(after)}</strong></td></tr>
<tr><th>ผลลัพธ์</th><td><strong>${verdict}</strong></td></tr>
</table>
${hint}${note}
<a class="download-btn" href="${state.url}" download="${escapeHtml(downloadName)}">⬇️ ดาวน์โหลด PDF ที่บีบอัดแล้ว</a>
`;
    resultEl.style.display = "block";

    if (window.resultFocusArm) window.resultFocusArm();
}

// =========================
// Init
// =========================

syncModeUi();
