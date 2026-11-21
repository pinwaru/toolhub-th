/* เลื่อนหน้าจอไปที่ผลลัพธ์ + เน้นกรอบผลลัพธ์ หลังผู้ใช้กดปุ่มคำนวณ/แปลง/สุ่ม ฯลฯ
   - ทำงานเฉพาะหลังผู้ใช้กดปุ่ม (หรือกด Enter / เลือกไฟล์) ไม่เลื่อนตอนเปิดหน้าหรือตอนพิมพ์
   - ไม่เลื่อนเมื่อกดปุ่มล้างข้อมูล/รีเซ็ต
   - ข้ามช่องที่ใส่ data-focus="off"
   - ถ้าผลลัพธ์อยู่ในจอแล้ว จะแค่กระพริบเน้น ไม่เลื่อน */
(function () {
  var SELECTOR = ".result, .result-box, .result-card, .winner-box, .preview-grid, .status";
  var RESET = /ล้าง|รีเซ็ต|reset|clear|ยกเลิก/i;
  var PLACEHOLDER = /ผลลัพธ์จะแสดง/;
  var armedUntil = 0;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function arm(ms) { armedUntil = Date.now() + (ms || 10000); }
  function disarm() { armedUntil = 0; }
  window.resultFocusArm = function () { arm(); }; // ให้เครื่องมือที่ประมวลผลนาน เรียกซ้ำตอนเสร็จ

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("button, input[type=button], input[type=submit], [role=button], .btn");
    if (!t || t.closest(".navbar, nav, .dropdown, .copy-wrap, footer, .tabs")) return;
    var label = (t.textContent || t.value || "").trim();
    if (RESET.test(label)) { disarm(); return; }
    arm();
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && /^(INPUT|SELECT)$/.test(e.target.tagName)) arm();
  }, true);

  document.addEventListener("change", function (e) {
    if (e.target.type === "file") arm();
  }, true);

  document.addEventListener("drop", function () { arm(); }, true);

  // พิมพ์/เลื่อนแถบ = การอัปเดตสด ไม่ใช่การกดคำนวณ
  document.addEventListener("input", function (e) {
    if (e.target.type !== "file") disarm();
  }, true);

  function isShown(box) {
    if (box.hidden) return false;
    var cs = getComputedStyle(box);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    return box.offsetParent !== null || cs.position === "fixed";
  }

  function hasContent(box) {
    if (box.querySelector("canvas, img, svg")) return true;
    var t = (box.textContent || "").replace(/\s+/g, " ").trim();
    return t.length > 0 && !PLACEHOLDER.test(t);
  }

  function navHeight() {
    var nav = document.querySelector(".navbar");
    if (!nav) return 0;
    var r = nav.getBoundingClientRect();
    return getComputedStyle(nav).position === "sticky" || getComputedStyle(nav).position === "fixed" ? Math.max(0, r.bottom) : 0;
  }

  function focusBox(box) {
    var r = box.getBoundingClientRect();
    var nav = navHeight();
    var vh = window.innerHeight;
    var comfortable = r.top >= nav + 4 && r.top <= vh * 0.6 && r.bottom <= vh + 40;
    if (!comfortable) {
      var top = window.pageYOffset + r.top - nav - 14;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    }
    if (!reduce) {
      box.classList.remove("result-pop");
      void box.offsetWidth;
      box.classList.add("result-pop");
      setTimeout(function () { box.classList.remove("result-pop"); }, 1200);
    }
  }

  var timers = new WeakMap();

  function schedule(box) {
    clearTimeout(timers.get(box));
    timers.set(box, setTimeout(function () {
      if (Date.now() > armedUntil) return;
      if (!isShown(box) || !hasContent(box)) return;
      disarm();
      focusBox(box);
    }, 90));
  }

  function watch(box) {
    if (box.getAttribute("data-focus") === "off" || box._rf) return;
    box._rf = true;
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === "attributes" && r.attributeName === "class") {
          var was = (r.oldValue || "").replace(/\bresult-pop\b/g, "").replace(/\s+/g, " ").trim();
          var now = box.className.replace(/\bresult-pop\b/g, "").replace(/\s+/g, " ").trim();
          if (was === now) continue; // เปลี่ยนแค่คลาสเอฟเฟกต์ของเราเอง
        }
        schedule(box);
        return;
      }
    }).observe(box, { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true, attributeFilter: ["style", "class", "hidden"] });
  }

  function init() {
    var boxes = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.parentElement && b.parentElement.closest(SELECTOR)) continue; // เฉพาะช่องนอกสุด
      watch(b);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
