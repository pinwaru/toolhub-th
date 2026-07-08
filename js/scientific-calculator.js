const display = document.getElementById("display");

let expression = "";

const buttons = document.querySelectorAll(".buttons button");

function updateDisplay() {
    display.value = expression || "0";
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

            case "equals":

                try {

                    const result = math.evaluate(expression);

                    expression = result.toString();

                    updateDisplay();

                } catch {

                    display.value = "Error";

                    expression = "";

                }

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

                if (expression.startsWith("-")) {
                    expression = expression.substring(1);
                } else {
                    expression = "-" + expression;
                }

                updateDisplay();

                break;

        }

    });

});
