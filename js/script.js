const search = document.getElementById("search");

if (search) {

    const tools = document.querySelectorAll(".tool");

    if (!tools.length) return;

    // Cache ข้อความสำหรับค้นหา
    tools.forEach(tool => {

        tool.dataset.search = tool.textContent
            .toLowerCase()
            .trim();

    });

    // กล่องแสดงเมื่อไม่พบผลลัพธ์
    const noResult = document.getElementById("noResult");

    let timer;

    search.addEventListener("input", () => {

        clearTimeout(timer);

        timer = setTimeout(() => {

            const keyword = search.value
                .trim()
                .toLowerCase();

            let found = false;

            tools.forEach(tool => {

                const match = tool.dataset.search.includes(keyword);

                tool.style.display = match ? "" : "none";

                if (match) {
                    found = true;
                }

            });

                // แสดง/ซ่อน ข้อความเมื่อไม่พบผลลัพธ์

            if (noResult) {

                noResult.style.display = found ? "none" : "block";

            }

        }, 150); // Debounce 150ms

    });

}
