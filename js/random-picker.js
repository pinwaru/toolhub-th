const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const itemsInput = document.getElementById('itemsInput');
const itemCount = document.getElementById('itemCount');
const winnerBox = document.getElementById('winnerBox');
const winnerText = document.getElementById('winnerText');

const colors = ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

let startAngle = 0;
let isSpinning = false;

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

itemsInput.addEventListener('input', drawWheel);

function spinWheel() {
  if (isSpinning) return;
  const items = getItems();
  if (items.length < 2) {
    alert("กรุณาใส่รายการอย่างน้อย 2 รายการครับ!");
    return;
  }

  isSpinning = true;
  winnerBox.style.display = "none";

  const spinAngleStart = Math.random() * 10 + 10;
  let spinTime = 0;
  const spinTimeTotal = Math.random() * 3000 + 4000;

  function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
      stopRotateWheel();
      return;
    }
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawWheel();
    requestAnimationFrame(rotateWheel);
  }
  rotateWheel();
}

function stopRotateWheel() {
  isSpinning = false;
  const items = getItems();
  const degrees = startAngle * 180 / Math.PI + 90;
  const arcd = 360 / items.length;
  const index = Math.floor((360 - degrees % 360) / arcd) % items.length;
  
  winnerText.textContent = items[index];
  winnerBox.style.display = "block";
}

function easeOut(t, b, c, d) {
  const ts = (t /= d) * t;
  const tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

// วาดวงล้อครั้งแรก
drawWheel();
