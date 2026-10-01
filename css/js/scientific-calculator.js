const display = document.getElementById("display");
const buttons = document.querySelectorAll(".buttons button");

let expression = "";

const operators = ["+", "-", "*", "/", "^", "%"];

/* ========================= */
/* Display */
/* ========================= */

function updateDisplay() {

    display.value = expression || "0";

    display.scrollLeft = display.scrollWidth;

}

/* ========================= */
/* Append */
/* ========================= */

function appendExpression(value) {

    if (expression.length >= 200) return;

    // ป้องกันเครื่องหมายซ้ำ
    if (operators.includes(value)) {

        const last = expression.slice(-1);

        if (operators.includes(last)) {

            expression =
                expression.slice(0, -1) + value;

            updateDisplay();

            return;

        }

    }

    // ป้องกัน . ซ้ำ
    if (value === ".") {

        const lastNumber =
            expression.split(/[+\-*/^()%]/).pop();

        if (lastNumber.includes(".")) {

            return;

        }

    }

    expression += value;

    updateDisplay();

}

/* ========================= */
/* Calculate */
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

            case "sqrt":

                appendExpression("sqrt(");

                break;

            case "square":

                appendExpression("^2");

                break;

            case "power":

                appendExpression("^");

                break;

            case "pi":

                appendExpression("pi");

                break;

            case "sin":

                appendExpression("sin(");

                break;

            case "cos":

                appendExpression("cos(");

                break;

            case "tan":

                appendExpression("tan(");

                break;

            case "log":

                appendExpression("log10(");

                break;

            case "ln":

                appendExpression("log(");

                break;

            case "negate":

                expression =
                    expression === ""
                        ? "-"
                        : `(-(${expression}))`;

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

    // อนุญาต Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X
    if (event.ctrlKey || event.metaKey) return;

    const key = event.key.toLowerCase();

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

        // วงเล็บ
        case "(":
        case ")":

            appendExpression(key);

            break;

        // Enter หรือ =
        case "enter":
        case "=":

            event.preventDefault();

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

        // √
        case "r":

            appendExpression("sqrt(");

            break;

        // π
        case "p":

            appendExpression("pi");

            break;

        // sin
        case "s":

            appendExpression("sin(");

            break;

        // cos
        case "c":

            appendExpression("cos(");

            break;

        // tan
        case "t":

            appendExpression("tan(");

            break;

        // log10
        case "l":

            appendExpression("log10(");

            break;

        // ln
        case "n":

            appendExpression("log(");

            break;

    }

});

/* ========================= */
/* Initial Display */
/* ========================= */

updateDisplay();
