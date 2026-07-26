const display = document.getElementById("display");
const buttons = document.querySelectorAll(".buttons button");

let expression = "";

function updateDisplay() {
    display.value = expression || "0";

    // เลื่อนตำแหน่งไปด้านขวาสุดเมื่อข้อความยาว
    display.scrollLeft = display.scrollWidth;
}

function calculate() {

    if (expression.trim() === "") return;

    try {

        const result = math.evaluate(expression);

        if (!isFinite(result)) {
            throw new Error();
        }

        expression = result.toString();

        updateDisplay();

    } catch {

        display.value = "Error";

        setTimeout(() => {
            expression = "";
            updateDisplay();
        }, 800);

    }

}

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const value = button.dataset.value;
        const action = button.dataset.action;

        if (value !== undefined) {

            // ป้องกันการกด . ซ้ำในเลขตัวเดียวกัน
            if (value === ".") {

                const lastNumber =
                    expression.split(/[+\-*/^()%]/).pop();

                if (lastNumber.includes(".")) {
                    return;
                }

            }

            expression += value;
            updateDisplay();
            return;

        }

        switch (action) {

            case "clear":

                expression = "";
                updateDisplay();
                break;

            case "backspace":

                expression = expression.slice(0, -1);
                updateDisplay();
                break;

            case "sqrt":

                expression += "sqrt(";
                updateDisplay();
                break;

            case "square":

                expression += "^2";
                updateDisplay();
                break;

            case "power":

                expression += "^";
                updateDisplay();
                break;

            case "pi":

                expression += "pi";
                updateDisplay();
                break;

            case "sin":

                expression += "sin(";
                updateDisplay();
                break;

            case "cos":

                expression += "cos(";
                updateDisplay();
                break;

            case "tan":

                expression += "tan(";
                updateDisplay();
                break;

            case "log":

                expression += "log10(";
                updateDisplay();
                break;

            case "ln":

                expression += "log(";
                updateDisplay();
                break;

            case "negate":

                if (expression === "") {

                    expression = "-";

                } else {

                    expression = `(-(${expression}))`;

                }

                updateDisplay();
                break;

            case "equals":

                calculate();
                break;

        }

    });

});

/* ========================= */
/* Keyboard Support */
/* ========================= */

document.addEventListener("keydown", (e) => {

    // อนุญาตให้ใช้ Ctrl+C / Ctrl+V / Ctrl+A / Ctrl+X
    if (e.ctrlKey || e.metaKey) return;

    const key = e.key;

    // ตัวเลขและเครื่องหมายพื้นฐาน
    if ("0123456789+-*/()%^".includes(key)) {

        expression += key;
        updateDisplay();
        return;

    }

    // ป้องกันการใส่ . ซ้ำในเลขเดียวกัน
    if (key === ".") {

        const lastNumber =
            expression.split(/[+\-*/^()%]/).pop();

        if (!lastNumber.includes(".")) {
            expression += ".";
            updateDisplay();
        }

        return;

    }

    switch (key.toLowerCase()) {

        // Enter หรือ =
        case "enter":
        case "=":
            e.preventDefault();
            calculate();
            break;

        // ลบทีละตัว
        case "backspace":
            expression = expression.slice(0, -1);
            updateDisplay();
            break;

        // ล้างทั้งหมด
        case "delete":
        case "escape":
            expression = "";
            updateDisplay();
            break;

        // ฟังก์ชันคณิตศาสตร์
        case "s":
            expression += "sin(";
            updateDisplay();
            break;

        case "c":
            expression += "cos(";
            updateDisplay();
            break;

        case "t":
            expression += "tan(";
            updateDisplay();
            break;

        case "l":
            expression += "log10(";
            updateDisplay();
            break;

        case "n":
            expression += "log(";
            updateDisplay();
            break;

        case "p":
            expression += "pi";
            updateDisplay();
            break;

        case "r":
            expression += "sqrt(";
            updateDisplay();
            break;

    }

});
