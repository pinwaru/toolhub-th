const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const itemsInput = document.getElementById('itemsInput');
const itemCount = document.getElementById('itemCount');
const winnerBox = document.getElementById('winnerBox');
const winnerText = document.getElementById('winnerText');

const colors = ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

let startAngle = 0;
let isSpinning = false;

// =========================
// เสียง (Web Audio API, ไม่ต้องใช้ไฟล์เสียงภายนอก)
// =========================
//
// สร้าง/ปลดล็อก AudioContext ทันทีตอนคลิกปุ่มหมุน (user gesture จริง)
// แล้วเก็บไว้ใช้ซ้ำตลอดการหมุน ไม่สร้างใหม่ระหว่างแอนิเมชันหรือตอนโชว์ผล
// เพื่อไม่ให้เบราว์เซอร์ (โดยเฉพาะ Safari/iOS) เงียบเสียงแบบไม่มี error

let audioCtx = null;

function unlockAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function playTone(freq, duration, delay = 0, type = "sine", volume = 0.15) {
    if (!audioCtx) return;
    try {
        const startTime = audioCtx.currentTime + delay;
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = freq;
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gain);
        gain.connect(audioCtx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    } catch (e) {
        // เบราว์เซอร์บางตัวอาจไม่รองรับ Web Audio API
    }
}

function playTick() {
    playTone(1300, 0.05, 0, "square", 0.07);
}

function playWinSound() {
    // ทำนองสั้นๆ แสดงความยินดี (โด-มี-ซอล-โดสูง)
    playTone(523.25, 0.18, 0, "triangle", 0.18);
    playTone(659.25, 0.18, 0.15, "triangle", 0.18);
    playTone(783.99, 0.18, 0.30, "triangle", 0.18);
    playTone(1046.50, 0.40, 0.45, "triangle", 0.22);
}

// =========================
// วงล้อ
// =========================

function getItems() {
  const text = itemsInput.value;
  return text.split('\n').map(item => item.trim()).filter(item => item.length > 0);
}

function drawWheel() {
  const items = getItems();
  itemCount.textContent = items.length;

  if (items.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const arc = (2 * Math.PI) / items.length;
  const outsideRadius = 150;
  const textRadius = 100;
  const insideRadius = 20;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < items.length; i++) {
    const angle = startAngle + i * arc;
    ctx.fillStyle = colors[i % colors.length];

    ctx.beginPath();
    ctx.arc(160, 160, outsideRadius, angle, angle + arc, false);
    ctx.arc(160, 160, insideRadius, angle + arc, angle, true);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Kanit";
    ctx.translate(160 + Math.cos(angle + arc / 2) * textRadius, 160 + Math.sin(angle + arc / 2) * textRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    const text = items[i].length > 10 ? items[i].substring(0, 8) + ".." : items[i];
    ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
    ctx.restore();
  }
}

itemsInput.addEventListener('input', () => {
  drawWheel();
  lastWinnerIndex = -1;
  if (typeof removeWinnerBtn !== 'undefined') removeWinnerBtn.style.display = 'none';
});

// คำนวณว่าเข็มชี้ไปตรงรายการลำดับที่เท่าไร จากมุมองศาปัจจุบันของวงล้อ
function getWinningIndex(angle, count) {
  const degrees = angle * 180 / Math.PI + 90;
  const arcd = 360 / count;
  return Math.floor((360 - degrees % 360) / arcd) % count;
}

function spinWheel() {
  if (isSpinning) return;
  const items = getItems();
  if (items.length < 2) {
    alert("กรุณาใส่รายการอย่างน้อย 2 รายการครับ!");
    return;
  }

  unlockAudio();

  isSpinning = true;
  winnerBox.style.display = "none";
  lastWinnerIndex = -1;
  clearConfetti();

  const baseAngle = startAngle;

  // หมุนเต็มรอบ 6-9 รอบ บวกตำแหน่งสุ่มเพิ่ม เพื่อให้ลุ้นได้เต็มที่
  // (ของเดิมคำนวณผิดจนหมุนได้แค่ ~1-3 รอบตลอดทั้งการหมุน จึงดูจบไวเกินไป)
  const fullSpins = 6 + Math.floor(Math.random() * 4);
  const extraAngle = Math.random() * 2 * Math.PI;
  const totalRotation = fullSpins * 2 * Math.PI + extraAngle;

  const duration = 4500 + Math.random() * 2000; // 4.5-6.5 วินาที
  const startTime = performance.now();

  let lastTickIndex = getWinningIndex(baseAngle, items.length);

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic: เริ่มไวแล้วค่อยๆ ช้าลงจนหยุด

    startAngle = baseAngle + totalRotation * eased;
    drawWheel();

    const currentIndex = getWinningIndex(startAngle, items.length);
    if (currentIndex !== lastTickIndex) {
      playTick();
      lastTickIndex = currentIndex;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      stopRotateWheel();
    }
  }

  requestAnimationFrame(animate);
}

// =========================
// ลบรายชื่อที่สุ่มได้ / ประวัติผู้ที่ถูกสุ่มแล้ว
// =========================

const autoRemove = document.getElementById('autoRemove');
const removeWinnerBtn = document.getElementById('removeWinnerBtn');
const pickedBox = document.getElementById('pickedBox');
const pickedList = document.getElementById('pickedList');
const pickedCount = document.getElementById('pickedCount');

let pickedHistory = [];   // รายชื่อที่ถูกลบออกจากวงล้อแล้ว (เรียงตามลำดับที่สุ่มได้)
let lastWinnerIndex = -1; // ลำดับ (ในรายการที่ไม่ว่าง) ของผู้ชนะล่าสุด ถ้ายังไม่ถูกลบ

try { autoRemove.checked = localStorage.getItem('rp_autoRemove') === '1'; } catch (e) {}
autoRemove.addEventListener('change', () => {
  try { localStorage.setItem('rp_autoRemove', autoRemove.checked ? '1' : '0'); } catch (e) {}
});

// ลบรายการลำดับที่ index (นับเฉพาะบรรทัดที่ไม่ว่าง) ออกจากช่องรายชื่อ
function removeItemAt(index) {
  const lines = itemsInput.value.split('\n');
  let n = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0) {
      n++;
      if (n === index) {
        lines.splice(i, 1);
        break;
      }
    }
  }
  itemsInput.value = lines.join('\n');
}

function renderPicked() {
  pickedCount.textContent = pickedHistory.length;
  pickedBox.style.display = pickedHistory.length ? 'block' : 'none';
  pickedList.innerHTML = '';
  pickedHistory.forEach((name, i) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    const no = document.createElement('span');
    no.className = 'no';
    no.textContent = (i + 1) + '.';
    label.appendChild(no);
    label.appendChild(document.createTextNode(name));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mini-btn';
    btn.textContent = '↩️ นำกลับ';
    btn.addEventListener('click', () => restoreOne(i));
    li.appendChild(label);
    li.appendChild(btn);
    pickedList.appendChild(li);
  });
}

function appendItems(names) {
  const cur = itemsInput.value.replace(/\s+$/, '');
  itemsInput.value = (cur ? cur + '\n' : '') + names.join('\n');
  drawWheel();
}

function restoreOne(i) {
  if (isSpinning) return;
  const [name] = pickedHistory.splice(i, 1);
  appendItems([name]);
  renderPicked();
}

function restoreAll() {
  if (isSpinning || !pickedHistory.length) return;
  appendItems(pickedHistory);
  pickedHistory = [];
  renderPicked();
}

function clearPicked() {
  pickedHistory = [];
  renderPicked();
}

// ลบผู้ชนะล่าสุดด้วยปุ่มในกล่องผลลัพธ์ (กรณีไม่ได้เปิดลบอัตโนมัติ)
function removeWinner() {
  if (isSpinning || lastWinnerIndex < 0) return;
  const items = getItems();
  const name = items[lastWinnerIndex];
  if (name === undefined) return;
  removeItemAt(lastWinnerIndex);
  pickedHistory.push(name);
  lastWinnerIndex = -1;
  removeWinnerBtn.style.display = 'none';
  renderPicked();
  drawWheel();
}

function stopRotateWheel() {
  isSpinning = false;
  const items = getItems();
  const index = getWinningIndex(startAngle, items.length);

  winnerText.textContent = items[index];
  winnerBox.style.display = "block";

  // รีสตาร์ทแอนิเมชันฉลอง แม้จะสุ่มติดกันหลายครั้ง
  winnerBox.classList.remove("celebrate");
  void winnerBox.offsetWidth;
  winnerBox.classList.add("celebrate");

  playWinSound();
  launchConfetti();

  lastWinnerIndex = index;
  if (autoRemove.checked) {
    // ลบออกจากรายชื่อทันที (สุ่มครั้งต่อไปจะไม่มีชื่อนี้) แต่คงภาพวงล้อไว้ครู่หนึ่งให้เห็นผู้ชนะ
    pickedHistory.push(items[index]);
    removeItemAt(index);
    lastWinnerIndex = -1;
    removeWinnerBtn.style.display = 'none';
    renderPicked();
    itemCount.textContent = getItems().length;
    setTimeout(() => { if (!isSpinning) drawWheel(); }, 1500);
    if (getItems().length < 2) {
      winnerText.textContent = items[index] + (getItems().length === 1 ? ' (เหลือ 1 รายการ เพิ่มรายชื่อหรือกดนำกลับเพื่อสุ่มต่อ)' : ' (ไม่เหลือรายการแล้ว)');
    }
  } else {
    removeWinnerBtn.style.display = 'inline-block';
  }
}

// =========================
// เอฟเฟกคอนเฟตตี้ฉลองผู้โชคดี
// =========================

function launchConfetti() {
  const confettiColors = ['#2563eb', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const pieceCount = 70;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.width = (6 + Math.random() * 6) + 'px';
    piece.style.height = (10 + Math.random() * 8) + 'px';
    piece.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
    piece.style.animationDelay = (Math.random() * 0.35) + 's';
    piece.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 4200);
}

function clearConfetti() {
  document.querySelectorAll('.confetti-container').forEach(el => el.remove());
}

// วาดวงล้อครั้งแรก
drawWheel();
