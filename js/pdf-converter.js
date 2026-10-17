// =========================
// แปลงรูปภาพเป็น PDF (ประมวลผลในเบราว์เซอร์ ด้วย pdf-lib)
// =========================

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const optionsSection = document.getElementById("optionsSection");
const listSection = document.getElementById("listSection");
const fileListEl = document.getElementById("fileList");
const fileCount = document.getElementById("fileCount");
const clearBtn = document.getElementById("clearBtn");
const addMoreBtn = document.getElementById("addMoreBtn");
const convertBtn = document.getElementById("convertBtn");
const statusEl = document.getElementById("status");

const optGroups = {
    pageSize: document.querySelectorAll('[data-group="pageSize"] button'),
    orientation: document.querySelectorAll('[data-group="orientation"] button'),
    margin: document.querySelectorAll('[data-group="margin"] button')
};

// ขนาดกระดาษหน่วย point (1 นิ้ว = 72pt)
const PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792]
};

// ขอบกระดาษหน่วย point
const MARGINS = { none: 0, small: 18, medium: 36 };

const MAX_FILES = 100;
const MAX_TOTAL_BYTES = 200 * 1024 * 1024;

const state = {
    files: [], // { id, file, url }
    pageSize: "a4",
    orientation: "auto",
    margin: "small"
};

let nextId = 1;

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

function isImage(file) {
    return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name);
}

// =========================
// Option groups
// =========================

Object.keys(optGroups).forEach(key => {
    optGroups[key].forEach(btn => {
        btn.addEventListener("click", () => {
            optGroups[key].forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state[key] = btn.dataset.value;
        });
    });
});

// =========================
// Drop zone
// =========================

dropZone.addEventListener("click", () => fileInput.click());
addMoreBtn.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", () => {
    if (fileInput.files) addFiles(fileInput.files);
    fileInput.value = "";
});

clearBtn.addEventListener("click", () => {
    state.files.forEach(f => URL.revokeObjectURL(f.url));
    state.files = [];
    setStatus("");
    render();
});

// =========================
// File list
// =========================

function addFiles(fileListLike) {
    const incoming = Array.from(fileListLike);
    const valid = incoming.filter(isImage);
    const skipped = incoming.length - valid.length;

    let total = state.files.reduce((s, f) => s + f.file.size, 0);
    let added = 0;

    for (const file of valid) {
        if (state.files.length >= MAX_FILES) {
            setStatus(`เพิ่มได้สูงสุด ${MAX_FILES} ไฟล์ต่อครั้ง`, "error");
            break;
        }
        if (total + file.size > MAX_TOTAL_BYTES) {
            setStatus("ขนาดไฟล์รวมเกิน 200 MB กรุณาแบ่งแปลงเป็นหลายครั้ง", "error");
            break;
        }
        total += file.size;
        state.files.push({ id: nextId++, file, url: URL.createObjectURL(file) });
        added++;
    }

    if (skipped > 0 && added > 0) {
        setStatus(`ข้ามไฟล์ที่ไม่ใช่รูปภาพ ${skipped} ไฟล์`, "error");
    } else if (skipped > 0 && added === 0) {
        setStatus("รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF, BMP)", "error");
    } else if (added > 0) {
        setStatus("");
    }

    render();
}

function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= state.files.length) return;
    const [item] = state.files.splice(index, 1);
    state.files.splice(target, 0, item);
    render();
}

function remove(index) {
    const [item] = state.files.splice(index, 1);
    URL.revokeObjectURL(item.url);
    render();
}

function render() {
    const has = state.files.length > 0;
    optionsSection.style.display = has ? "block" : "none";
    listSection.style.display = has ? "block" : "none";
    convertBtn.disabled = !has;
    fileCount.textContent = `${state.files.length} ไฟล์`;

    fileListEl.innerHTML = "";

    state.files.forEach((item, i) => {
        const li = document.createElement("li");
        li.className = "file-item";

        const no = document.createElement("span");
        no.className = "no";
        no.textContent = i + 1;

        const img = document.createElement("img");
        img.src = item.url;
        img.alt = "";

        const meta = document.createElement("div");
        meta.className = "meta";
        const name = document.createElement("div");
        name.className = "name";
        name.textContent = item.file.name;
        name.title = item.file.name;
        const size = document.createElement("div");
        size.className = "size";
        size.textContent = formatBytes(item.file.size);
        meta.append(name, size);

        const actions = document.createElement("div");
        actions.className = "actions";
        actions.append(
            makeBtn("↑", "เลื่อนขึ้น", () => move(i, -1), i === 0),
            makeBtn("↓", "เลื่อนลง", () => move(i, 1), i === state.files.length - 1),
            makeBtn("✕", "ลบ", () => remove(i), false, "del")
        );

        li.append(no, img, meta, actions);
        fileListEl.appendChild(li);
    });
}

function makeBtn(label, title, onClick, disabled, cls) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.title = title;
    b.setAttribute("aria-label", title);
    if (cls) b.className = cls;
    b.disabled = !!disabled;
    b.addEventListener("click", onClick);
    return b;
}

// =========================
// Image decoding
// =========================

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("load"));
        img.src = url;
    });
}

function canvasToBytes(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("encode"));
            resolve(new Uint8Array(await blob.arrayBuffer()));
        }, type, quality);
    });
}

// คืนค่า { bytes, kind: "jpg"|"png", width, height }
// วาดผ่าน canvas เสมอ เพื่อให้เบราว์เซอร์หมุนรูปตาม EXIF ให้ถูกต้อง
async function prepareImage(item) {
    const img = await loadImage(item.url);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) throw new Error("size");

    const isPng = item.file.type === "image/png";

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (isPng) {
        // คงความโปร่งใสของ PNG
        ctx.drawImage(img, 0, 0);
        return { bytes: await canvasToBytes(canvas, "image/png"), kind: "png", width, height };
    }

    // JPG / WEBP / GIF / BMP -> JPEG พื้นขาว
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    return { bytes: await canvasToBytes(canvas, "image/jpeg", 0.92), kind: "jpg", width, height };
}

// =========================
// Build PDF
// =========================

function pageDims(imgW, imgH) {
    const m = MARGINS[state.margin];

    if (state.pageSize === "fit") {
        // ขนาดหน้าเท่ารูป (บวกขอบ) จำกัดให้ไม่ใหญ่เกินขีดจำกัดของ PDF
        const scale = Math.min(1, 14000 / Math.max(imgW, imgH));
        const w = imgW * scale, h = imgH * scale;
        return { pw: w + m * 2, ph: h + m * 2, dw: w, dh: h, x: m, y: m };
    }

    let [pw, ph] = PAGE_SIZES[state.pageSize];
    const landscape = state.orientation === "landscape" ||
        (state.orientation === "auto" && imgW > imgH);
    if (landscape) [pw, ph] = [ph, pw];

    const availW = pw - m * 2;
    const availH = ph - m * 2;
    const scale = Math.min(availW / imgW, availH / imgH);
    const dw = imgW * scale, dh = imgH * scale;

    return { pw, ph, dw, dh, x: (pw - dw) / 2, y: (ph - dh) / 2 };
}

convertBtn.addEventListener("click", async () => {
    if (!state.files.length) return;

    if (!window.PDFLib) {
        setStatus("โหลดไลบรารี PDF ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า", "error");
        return;
    }

    convertBtn.disabled = true;
    const originalLabel = convertBtn.textContent;
    const failed = [];

    try {
        const pdf = await PDFLib.PDFDocument.create();
        pdf.setCreator("ToolHub TH");
        pdf.setProducer("ToolHub TH");

        for (let i = 0; i < state.files.length; i++) {
            const item = state.files[i];
            convertBtn.textContent = `⏳ กำลังแปลง ${i + 1}/${state.files.length}...`;
            // ปล่อยให้ UI อัปเดตระหว่างไฟล์
            await new Promise(r => setTimeout(r, 0));

            try {
                const prepared = await prepareImage(item);
                const embedded = prepared.kind === "png"
                    ? await pdf.embedPng(prepared.bytes)
                    : await pdf.embedJpg(prepared.bytes);

                const d = pageDims(prepared.width, prepared.height);
                const page = pdf.addPage([d.pw, d.ph]);
                page.drawImage(embedded, { x: d.x, y: d.y, width: d.dw, height: d.dh });
            } catch (err) {
                failed.push(item.file.name);
            }
        }

        if (pdf.getPageCount() === 0) {
            setStatus("แปลงไม่สำเร็จ ไฟล์รูปอาจเสียหรือเบราว์เซอร์ไม่รองรับ", "error");
            return;
        }

        const bytes = await pdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const first = state.files[0].file.name.replace(/\.[^/.]+$/, "");
        const fileName = state.files.length === 1 ? `${first}.pdf` : `${first}-and-more.pdf`;

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        let msg = `✅ สร้าง PDF สำเร็จ ${pdf.getPageCount()} หน้า (${formatBytes(blob.size)})`;
        if (failed.length) msg += ` — ข้ามไฟล์ที่อ่านไม่ได้: ${failed.join(", ")}`;
        setStatus(msg, failed.length ? "error" : "ok");
    } catch (err) {
        setStatus("เกิดข้อผิดพลาดระหว่างสร้าง PDF ลองลดจำนวนหรือขนาดรูปแล้วลองใหม่", "error");
    } finally {
        convertBtn.textContent = originalLabel;
        convertBtn.disabled = state.files.length === 0;
    }
});

render();
