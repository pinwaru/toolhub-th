document.addEventListener("DOMContentLoaded", () => {
    const search = document.getElementById("search");

    if (!search) return;

    const tools = document.querySelectorAll(".tool");
    if (!tools.length) return;

    // Cache ข้อความสำหรับค้นหา โดยตัดช่องว่างส่วนเกินออกให้สะอาด
    tools.forEach(tool => {
        const title = tool.querySelector("h2") ? tool.querySelector("h2").textContent : "";
        const desc = tool.querySelector("p") ? tool.querySelector("p").textContent : "";
        
        // รวมชื่อและคำอธิบาย แล้วลบเว้นวรรค/ขึ้นบรรทัดใหม่ที่เกินมา
        tool.dataset.search = `${title} ${desc}`
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    });

    const noResult = document.getElementById("noResult");
    let timer;

    search.addEventListener("input", () => {
        clearTimeout(timer);

        timer = setTimeout(() => {
            const keyword = search.value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' '); // ทำความสะอาดคำค้นหา

            let foundCount = 0;

            tools.forEach(tool => {
                // ถ้า keyword ว่างเปล่า หรือเจอคำตรงกัน
                const isMatch = !keyword || tool.dataset.search.includes(keyword);

                if (isMatch) {
                    tool.style.display = "block"; // กำหนดค่าการแสดงผลให้ชัดเจน
                    foundCount++;
                } else {
                    tool.style.display = "none";
                }
            });

            // แสดง/ซ่อน ข้อความเมื่อไม่พบผลลัพธ์
            if (noResult) {
                noResult.style.display = (foundCount > 0) ? "none" : "block";
            }

        }, 150); // Debounce 150ms
    });
});
