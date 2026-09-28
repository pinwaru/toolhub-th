// แปลงดอกเบี้ย Flat Rate เป็น Effective Rate (ต่อปี แบบ nominal = อัตราต่องวด x 12)
function flatToEffective(principal, flatPct, years) {
  var n = Math.round(years * 12);
  var payment = (principal + principal * (flatPct / 100) * years) / n;
  if (flatPct <= 0) return { payment: payment, n: n, effective: 0 };
  // หาอัตราต่อเดือน i ที่ทำให้ค่างวด = สูตรผ่อนแบบลดต้นลดดอก (bisection)
  var lo = 0, hi = 1;
  for (var k = 0; k < 200; k++) {
    var i = (lo + hi) / 2;
    var pv = payment * (1 - Math.pow(1 + i, -n)) / i;
    if (pv > principal) lo = i; else hi = i;
  }
  return { payment: payment, n: n, effective: ((lo + hi) / 2) * 12 * 100 };
}
if (typeof document !== 'undefined') {
  var fmt = function (v) { return v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  document.getElementById('calculateBtn').addEventListener('click', function () {
    var p = parseFloat(document.getElementById('loanAmount').value);
    var f = parseFloat(document.getElementById('flatRate').value);
    var y = parseFloat(document.getElementById('loanYears').value);
    var msg = document.getElementById('errorMsg');
    if (!(p > 0) || !(f >= 0) || !(y > 0)) { msg.textContent = 'กรุณากรอกจำนวนเงินกู้ ดอกเบี้ย และระยะเวลาให้ครบและมากกว่า 0'; return; }
    msg.textContent = '';
    var r = flatToEffective(p, f, y);
    document.getElementById('monthlyPayment').textContent = fmt(r.payment) + ' บาท';
    document.getElementById('totalInterest').textContent = fmt(r.payment * r.n - p) + ' บาท';
    document.getElementById('effectiveRate').textContent = r.effective.toFixed(2) + '% ต่อปี';
    document.getElementById('ratio').textContent = f > 0 ? 'ดอกเบี้ยจริงสูงกว่าที่โฆษณาประมาณ ' + (r.effective / f).toFixed(2) + ' เท่า' : '';
  });
}
if (typeof module !== 'undefined') module.exports = { flatToEffective: flatToEffective };
