// =========================
// Navigation: mega menu (เดสก์ท็อป) + แฮมเบอร์เกอร์ (มือถือ)
// =========================
//
// - คลิกเพื่อเปิด/ปิดเมนูย่อย (ใช้ได้ทั้งเมาส์และนิ้ว)
// - มือถือ: ปุ่มแฮมเบอร์เกอร์ เปิดแผงเมนูเต็มความกว้าง หมวดเครื่องมือพับได้
// - ปิดได้ด้วย Esc, คลิกนอกเมนู, หรือกดลิงก์
// - ไฮไลต์เมนูของหน้าที่เปิดอยู่

(function () {
    "use strict";

    function init() {
        var navbar = document.querySelector(".navbar");
        if (!navbar || navbar.dataset.navReady) return;
        navbar.dataset.navReady = "1";

        var root = document.documentElement;
        var menu = navbar.querySelector(".menu");
        var dropdowns = Array.prototype.slice.call(navbar.querySelectorAll(".dropdown"));
        var mq = window.matchMedia ? window.matchMedia("(max-width: 860px)") : { matches: false };

        root.classList.add("has-js");

        /* ---------- id + ปุ่มแฮมเบอร์เกอร์ + ฉากหลัง ---------- */

        if (menu && !menu.id) menu.id = "site-menu";

        var burger = document.createElement("button");
        burger.type = "button";
        burger.className = "nav-burger";
        burger.setAttribute("aria-label", "เปิดเมนู");
        burger.setAttribute("aria-expanded", "false");
        if (menu) burger.setAttribute("aria-controls", menu.id);
        burger.innerHTML = "<span></span><span></span><span></span>";
        if (menu) navbar.insertBefore(burger, menu);
        else navbar.appendChild(burger);

        var scrim = document.createElement("div");
        scrim.className = "nav-scrim";
        scrim.setAttribute("aria-hidden", "true");
        document.body.appendChild(scrim);

        /* ---------- เตรียมโครงสร้างภายในเมนู ---------- */

        dropdowns.forEach(function (d) {
            if (d.querySelector(".dropdown-panel.mega")) d.classList.add("has-mega");
        });

        // หัวข้อหมวด: แยกอีโมจิเป็นไอคอน + ปุ่มพับ + จำนวนเครื่องมือ
        var cols = Array.prototype.slice.call(navbar.querySelectorAll(".dropdown-col"));
        cols.forEach(function (col) {
            var h4 = col.querySelector("h4");
            if (!h4) return;
            var text = h4.textContent.trim();
            var m = text.match(/^(\S+)\s+([\s\S]+)$/);
            var icon = m ? m[1] : "";
            var label = m ? m[2] : text;
            var count = col.querySelectorAll("a").length;

            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "col-head";
            btn.innerHTML =
                (icon ? '<span class="dd-ico" aria-hidden="true"></span>' : "") +
                '<span class="col-label"></span>' +
                '<span class="col-count"></span>' +
                '<span class="col-chev" aria-hidden="true"></span>';
            if (icon) btn.querySelector(".dd-ico").textContent = icon;
            btn.querySelector(".col-label").textContent = label;
            btn.querySelector(".col-count").textContent = count;
            h4.textContent = "";
            h4.appendChild(btn);

            btn.addEventListener("click", function () {
                if (!mq.matches) return;
                var open = !col.classList.contains("col-open");
                col.classList.toggle("col-open", open);
                btn.setAttribute("aria-expanded", String(open));
            });
        });

        // แถบท้ายเมนู: ข้อความบอกจำนวนทั้งหมด
        var allCol = navbar.querySelector(".dropdown-col-all");
        if (allCol) {
            var total = navbar.querySelectorAll(".dropdown-col:not(.dropdown-col-all) a").length;
            var note = document.createElement("span");
            note.className = "col-note";
            note.textContent = "มีเครื่องมือฟรี " + total + " รายการ ใช้ได้ทันที ไม่ต้องสมัครสมาชิก";
            allCol.insertBefore(note, allCol.firstChild);
        }

        function syncColMode() {
            var mobile = mq.matches;
            cols.forEach(function (col) {
                var btn = col.querySelector(".col-head");
                if (!btn) return;
                btn.disabled = !mobile; // เดสก์ท็อป: เป็นหัวข้อธรรมดา โฟกัสไม่ได้
                if (mobile) btn.setAttribute("aria-expanded", String(col.classList.contains("col-open")));
                else btn.removeAttribute("aria-expanded");
            });
        }

        /* ---------- ไฮไลต์หน้าปัจจุบัน ---------- */

        function norm(path) {
            return path
                .replace(/\/index\.html$/, "/")
                .replace(/\.html$/, "")
                .replace(/\/+$/, "");
        }

        var here = norm(location.pathname);
        var links = Array.prototype.slice.call(navbar.querySelectorAll(".menu a[href]"));
        links.forEach(function (a) {
            var p;
            try { p = norm(new URL(a.getAttribute("href"), location.href).pathname); }
            catch (e) { return; }
            if (p === here) {
                a.setAttribute("aria-current", "page");
                var dd = a.closest(".dropdown");
                if (dd) {
                    var t = dd.querySelector(".dropdown-toggle");
                    if (t) t.classList.add("is-current");
                    var col = a.closest(".dropdown-col");
                    if (col) col.classList.add("col-open");
                }
            }
        });
        // หน้าบทความย่อย → ไฮไลต์ "บทความ"
        if (/\/blog\//.test(location.pathname)) {
            links.forEach(function (a) {
                if (/blog\.html$/.test(a.getAttribute("href"))) a.classList.add("is-current");
            });
        }
        syncColMode();

        /* ---------- เปิด/ปิด ---------- */

        function closeDropdowns(except) {
            dropdowns.forEach(function (d) {
                if (d === except) return;
                d.classList.remove("open");
                var b = d.querySelector(".dropdown-toggle");
                if (b) b.setAttribute("aria-expanded", "false");
            });
        }

        function setMenu(open) {
            navbar.classList.toggle("menu-open", open);
            root.classList.toggle("nav-open", open && mq.matches);
            burger.setAttribute("aria-expanded", String(open));
            burger.setAttribute("aria-label", open ? "ปิดเมนู" : "เปิดเมนู");
            if (!open) closeDropdowns(null);
        }

        dropdowns.forEach(function (d) {
            var toggle = d.querySelector(".dropdown-toggle");
            if (!toggle) return;
            toggle.addEventListener("click", function (e) {
                e.stopPropagation();
                var open = !d.classList.contains("open");
                closeDropdowns(d);
                d.classList.toggle("open", open);
                toggle.setAttribute("aria-expanded", String(open));
            });
        });

        burger.addEventListener("click", function (e) {
            e.stopPropagation();
            setMenu(!navbar.classList.contains("menu-open"));
        });

        scrim.addEventListener("click", function () { setMenu(false); });

        // คลิกนอกเมนู
        document.addEventListener("click", function (e) {
            if (!navbar.contains(e.target)) {
                closeDropdowns(null);
                if (navbar.classList.contains("menu-open")) setMenu(false);
            }
        });

        // กดลิงก์แล้วปิดเมนู (กรณีไปยัง anchor ในหน้าเดิม)
        navbar.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest("a[href]");
            if (a && navbar.classList.contains("menu-open")) setMenu(false);
            else if (a) closeDropdowns(null);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            var wasOpen = navbar.classList.contains("menu-open");
            var openDd = dropdowns.filter(function (d) { return d.classList.contains("open"); })[0];
            closeDropdowns(null);
            if (wasOpen) { setMenu(false); burger.focus(); }
            else if (openDd) { var b = openDd.querySelector(".dropdown-toggle"); if (b) b.focus(); }
        });

        /* ---------- ขนาดหน้าจอ / การเลื่อน ---------- */

        function setNavHeight() {
            root.style.setProperty("--nav-h", navbar.offsetHeight + "px");
        }

        function onScroll() {
            navbar.classList.toggle("is-scrolled", (window.scrollY || root.scrollTop) > 4);
        }

        function onModeChange() {
            syncColMode();
            if (!mq.matches) { navbar.classList.remove("menu-open"); root.classList.remove("nav-open"); burger.setAttribute("aria-expanded", "false"); }
            closeDropdowns(null);
            setNavHeight();
        }

        if (mq.addEventListener) mq.addEventListener("change", onModeChange);
        else if (mq.addListener) mq.addListener(onModeChange);

        window.addEventListener("resize", setNavHeight);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("load", setNavHeight);
        setNavHeight();
        onScroll();
    }

    if (document.querySelector(".navbar")) init();
    else document.addEventListener("DOMContentLoaded", init);
})();
