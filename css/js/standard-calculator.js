const display = document.getElementById("display");
const buttons = document.querySelectorAll(".buttons button");

let expression = "";

const operators = ["+", "-", "*", "/", "%", "^"];

/* ========================= */
/* Display */
/* ========================= */

function updateDisplay() {

    display.value = expression || "0";

    // เลื่อนไปด้านขวาสุดเมื่อข้อความยาว
    display.scrollLeft = display.scrollWidth;

}

/* ========================= */
/* เพิ่มข้อมูลลง Expression */
/* ========================= */

function appendExpression(value) {

    if (expression.length >= 100) return;

    // ป้องกันกดเครื่องหมายซ้ำ
    if (operators.includes(value)) {

        const last = expression.slice(-1);

        if (operators.includes(last)) {

            expression =
                expression.slice(0, -1) + value;

            updateDisplay();

            return;

        }

    }

    // ป้องกัน . ซ้ำในเลขตัวเดียวกัน
    if (value === ".") {

        const lastNumber =
            expression.split(/[+\-*/%^()]/).pop();

        if (lastNumber.includes(".")) {

            return;

        }

    }

    expression += value;

    updateDisplay();

}

/* ========================= */
/* คำนวณ */
/* ========================= */

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

        expression = "";

        setTimeout(updateDisplay, 800);

    }

}

/* ========================= */
/* Button Click */
/* ========================= */

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const value = button.dataset.value;

        const action = button.dataset.action;

        if (value !== undefined) {

            appendExpression(value);

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

document.addEventListener("keydown", (event) => {

    // ไม่ดักปุ่มถ้ากำลังพิมพ์ใน input หรือ textarea
    if (

        event.target.tagName === "INPUT" ||

        event.target.tagName === "TEXTAREA"

    ) {

        return;

    }

    // อนุญาต Ctrl+C Ctrl+V Ctrl+A Ctrl+X
    if (event.ctrlKey || event.metaKey) return;

    const key = event.key;

    // ไม่รับ Space
    if (key === " ") {

        event.preventDefault();

        return;

    }

    // ตัวเลข
    if ("0123456789".includes(key)) {

        appendExpression(key);

        return;

    }

    // เครื่องหมาย
    if ("+-*/%^".includes(key)) {

        appendExpression(key);

        return;

    }

    // จุดทศนิยม
    if (key === ".") {

        appendExpression(".");

        return;

    }

    switch (key) {

        case "(":
        case ")":

            appendExpression(key);

            break;

        case "Enter":
        case "NumpadEnter":
        case "=":

            event.preventDefault();

            calculate();

            break;

        case "Backspace":

            event.preventDefault();

            expression = expression.slice(0, -1);

            updateDisplay();

            break;

        case "Delete":
        case "Escape":

            event.preventDefault();

            expression = "";

            updateDisplay();

            break;

    }

});

/* ========================= */
/* Initial Display */
/* ========================= */

updateDisplay();
