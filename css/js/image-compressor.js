// =========================
// Elements
// =========================

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const optionsSection = document.getElementById("optionsSection");

const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");

const maxWidthSlider = document.getElementById("maxWidth");
const maxWidthValue = document.getElementById("maxWidthValue");

const formatButtons = document.querySelectorAll(".format-buttons button");

const previewGrid = document.getElementById("previewGrid");
const originalImg = document.getElementById("originalImg");
const originalSize = document.getElementById("originalSize");
const compressedImg = document.getElementById("compressedImg");
const compressedSize = document.getElementById("compressedSize");
const savedBadge = document.getElementById("savedBadge");

const downloadBtn = document.getElementById("downloadBtn");

// =========================
// State
// =========================

let originalFile = null;
let originalImageEl = null;
let selectedFormat = "image/jpeg";
let compressedBlobUrl = null;
let compressedFileName = "compressed-image.jpg";

// =========================
// Helpers
// =========================

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extensionForFormat(format) {
    if (format === "image/png") return "png";
    if (format === "image/webp") return "webp";
    return "jpg";
}

// =========================
// Drop zone interactions
// =========================

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
    }
});

// =========================
// Format buttons
// =========================

formatButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        formatButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedFormat = btn.dataset.format;
        if (originalFile) compressImage();
    });
});

// =========================
// Sliders
// =========================

qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
    if (originalFile) compressImage();
});

maxWidthSlider.addEventListener("input", () => {
    maxWidthValue.textContent = `${maxWidthSlider.value}px`;
    if (originalFile) compressImage();
});

// =========================
// Handle uploaded file
// =========================

function handleFile(file) {
    if (!file.type.startsWith("image/")) {
        alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)");
        return;
    }

    originalFile = file;

    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
            originalImageEl = img;

            originalImg.src = e.target.result;
            originalSize.textContent = formatBytes(file.size);

            optionsSection.style.display = "block";
            previewGrid.style.display = "grid";

            compressImage();
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// =========================
// Compress via Canvas
// =========================

function compressImage() {
    if (!originalImageEl) return;

    const maxWidth = parseInt(maxWidthSlider.value, 10);
    const quality = parseInt(qualitySlider.value, 10) / 100;

    let { width, height } = originalImageEl;

    if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (selectedFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(originalImageEl, 0, 0, width, height);

    canvas.toBlob((blob) => {
        if (!blob) return;

        if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);

        compressedBlobUrl = URL.createObjectURL(blob);
        compressedImg.src = compressedBlobUrl;
        compressedSize.textContent = formatBytes(blob.size);

        const savedPercent = Math.max(
            0,
            Math.round(((originalFile.size - blob.size) / originalFile.size) * 100)
        );

        if (blob.size < originalFile.size) {
            savedBadge.textContent = `ลดขนาดลง ${savedPercent}%`;
            savedBadge.style.display = "inline-block";
        } else {
            savedBadge.style.display = "none";
        }

        const baseName = originalFile.name.replace(/\.[^/.]+$/, "");
        compressedFileName = `${baseName}-compressed.${extensionForFormat(selectedFormat)}`;

        downloadBtn.removeAttribute("disabled");
        downloadBtn.href = compressedBlobUrl;
        downloadBtn.download = compressedFileName;

    }, selectedFormat, quality);
}
