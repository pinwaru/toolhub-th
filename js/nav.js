// =========================
// Dropdown navigation (เครื่องมือ / เกี่ยวกับ)
// =========================
//
// ใช้การคลิกเปิด/ปิด แทนการชี้เมาส์ (hover) เพื่อให้ใช้งานได้ดีทั้งบนมือถือ
// และเดสก์ท็อป และไม่บังผู้ใช้ที่ต้องการกดลิงก์ในเมนูโดยตรง

document.addEventListener("DOMContentLoaded", () => {

    const dropdowns = document.querySelectorAll(".dropdown");

    function closeAll(except) {
        dropdowns.forEach(d => {
            if (d !== except) {
                d.classList.remove("open");
                const btn = d.querySelector(".dropdown-toggle");
                if (btn) btn.setAttribute("aria-expanded", "false");
            }
        });
    }

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector(".dropdown-toggle");
        if (!toggle) return;

        toggle.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = dropdown.classList.contains("open");
            closeAll(dropdown);
            dropdown.classList.toggle("open", !isOpen);
            toggle.setAttribute("aria-expanded", String(!isOpen));
        });
    });

    document.addEventListener("click", () => closeAll(null));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAll(null);
    });
});
