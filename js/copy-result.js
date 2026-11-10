/* ปุ่ม "คัดลอกผลลัพธ์" อัตโนมัติสำหรับทุกเครื่องมือ
   - หาช่องผลลัพธ์ (.result / .result-box) แล้วเพิ่มปุ่มไว้ท้ายช่อง
   - ปุ่มแสดงเมื่อมีผลลัพธ์จริง ข้อความที่คัดลอกมีหัวข้อ ตัวเลข หน่วย และลิงก์เครื่องมือ
   - ข้ามช่องที่ใส่ data-copy="off" หรือมีปุ่มคัดลอกของตัวเองอยู่แล้ว */
(function () {
  var BLOCK = /^(DIV|P|H1|H2|H3|H4|H5|H6|LI|UL|OL|TABLE|TBODY|THEAD|TR|SECTION|BR)$/;
  var SKIP = /^(BUTTON|INPUT|SELECT|TEXTAREA|CANVAS|IMG|SCRIPT|STYLE|SVG|AUDIO|VIDEO)$/;
  var EMPTY = /ผลลัพธ์จะแสดง|กรุณา|ไม่ถูกต้อง|เกิดข้อผิดพลาด/;

  function walk(node, out) {
    if (node.nodeType === 3) { out.push(node.nodeValue); return; }
    if (node.nodeType !== 1 || SKIP.test(node.tagName)) return;
    if (node.hidden || (node.style && node.style.display === "none")) return;
    var tag = node.tagName, cls = node.className || "";
    if (tag === "TR") {
      var cells = [].map.call(node.children, function (c) { return clean(c); }).filter(Boolean);
      if (cells.length) out.push("\n" + cells.join(cells.length > 2 ? " | " : ": ") + "\n");
      return;
    }
    if (/\b(result-item|goal-item|summary-item|item)\b/.test(cls)) {
      var parts = [].map.call(node.children, function (c) { return clean(c); }).filter(Boolean);
      if (parts.length) out.push("\n" + parts.join(": ") + "\n");
      return;
    }
    var block = BLOCK.test(tag);
    if (block) out.push("\n");
    for (var i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i], out);
    if (block) out.push("\n");
  }

  function clean(el) {
    var out = [];
    walk(el, out);
    return out.join("").replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, " ").trim();
  }

  function build(box) {
    var out = [];
    walk(box, out);
    var body = out.join("").replace(/[ \t ]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{2,}/g, "\n").trim();
    body = body.replace(/\n(?:=|⬇️|➡️|→)\n/g, " = "); // ลูกศร/เท่ากับ รวมเป็นบรรทัดเดียว
    var h1 = document.querySelector("h1");
    var title = h1 ? h1.textContent.replace(/\s+/g, " ").trim() : document.title;
    return title + "\n" + body + "\n\n🔗 " + location.href.split("#")[0];
  }

  function hasResult(box) {
    if (box.hidden || box.style.display === "none") return false;
    var gate = box.getAttribute("data-copy-ready"); // ตัวชี้ว่าคำนวณแล้ว (ไม่ใช่ค่าเริ่มต้น "-")
    if (gate) { var g = document.querySelector(gate); if (!g || !/[0-9ก-ฮ]/.test(g.textContent)) return false; }
    if (box.offsetParent === null && getComputedStyle(box).position !== "fixed") return false;
    var t = clean(box);
    return t.length > 0 && !EMPTY.test(t) && /[1-9]/.test(t); // ต้องมีตัวเลขที่ไม่ใช่ศูนย์ (กันค่าเริ่มต้น - / 0.00)
  }

  function copy(text, btn) {
    var label = btn.getAttribute("data-label");
    function ok() { btn.textContent = "✅ คัดลอกแล้ว"; setTimeout(function () { btn.textContent = label; }, 1800); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { btn.textContent = "คัดลอกไม่สำเร็จ"; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  }

  function attach(box) {
    if (box.getAttribute("data-copy") === "off" || box.querySelector(".copy-btn")) return;
    var wrap = document.createElement("div");
    wrap.className = "copy-wrap";
    wrap.style.display = "none";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("data-label", "📋 คัดลอกผลลัพธ์");
    btn.textContent = "📋 คัดลอกผลลัพธ์";
    btn.addEventListener("click", function () { copy(build(box), btn); });
    wrap.appendChild(btn);
    box.parentNode.insertBefore(wrap, box.nextSibling);

    function update() { wrap.style.display = hasResult(box) ? "" : "none"; }
    new MutationObserver(update).observe(box, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["style", "class", "hidden"] });
    update();
  }

  function init() {
    var boxes = document.querySelectorAll(".result, .result-box");
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.parentElement && b.parentElement.closest(".result, .result-box")) continue; // เฉพาะช่องนอกสุด
      attach(b);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
