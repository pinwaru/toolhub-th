const search = document.getElementById("search");

if (search) {

    const tools = document.querySelectorAll(".tool");

    search.addEventListener("input", () => {

        const keyword = search.value.trim().toLowerCase();

        tools.forEach(tool => {

            const text = tool.textContent.toLowerCase();

            tool.style.display = text.includes(keyword) ? "" : "none";

        });

    });

}
