const display = document.getElementById("display");
const buttons = document.querySelectorAll(".buttons button");

let expression = "";

function updateDisplay() {
    display.value = expression || "0";
}

function calculate() {
    if (expression === "") return;

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

    const key = e.key;

    if ("0123456789+-*/().%".includes(key)) {

        expression += key;
        updateDisplay();

    }

    else if (key === "Enter") {

        e.preventDefault();
        calculate();

    }

    else if (key === "Backspace") {

        e.preventDefault();
        expression = expression.slice(0, -1);
        updateDisplay();

    }

    else if (key === "Escape") {

        expression = "";
        updateDisplay();

    }

});
