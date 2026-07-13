const display = document.getElementById("display");
const buttons = document.querySelectorAll(".buttons button");

let expression = "";

function updateDisplay() {
    display.value = expression || "0";
}

function calculate() {

    if (expression.trim() === "") return;

    try {

        const result = math.evaluate(expression);

        expression = result.toString();

        updateDisplay();

    } catch {

        display.value = "Error";
        expression = "";

    }

}

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const value = button.dataset.value;
        const action = button.dataset.action;

        if (value !== undefined) {

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

            case "negate":

                if (expression === "") {

                    expression = "-";

                } else if (expression.startsWith("-")) {

                    expression = expression.substring(1);

                } else {

                    expression = "-" + expression;

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

    // ไม่ดักปุ่มถ้ากำลังพิมพ์ใน input หรือ textarea
    if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA"
    ) {
        return;
    }

    // อนุญาต Ctrl+C Ctrl+V Ctrl+A
    if (e.ctrlKey || e.metaKey) return;

    const key = e.key;

    if ("0123456789+-*/().%^".includes(key)) {

        expression += key;
        updateDisplay();
        return;

    }

    switch (key) {

        case "Enter":
        case "NumpadEnter":

            e.preventDefault();
            calculate();
            break;

        case "Backspace":

            e.preventDefault();
            expression = expression.slice(0, -1);
            updateDisplay();
            break;

        case "Delete":
        case "Escape":

            e.preventDefault();
            expression = "";
            updateDisplay();
            break;

    }

});
