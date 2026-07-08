const display = document.getElementById("display");
const buttons = document.querySelectorAll(".buttons button");

let expression = "";

function updateDisplay() {
    display.value = expression || "0";
}

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const value = button.dataset.value;
        const action = button.dataset.action;

        // ปุ่มตัวเลขและเครื่องหมาย
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

                if (expression === "") return;

                try {

                    let exp = expression;

                    // แทนค่า π
                    exp = exp.replace(/π/g, "pi");

                    const result = math.evaluate(exp);

                    expression = result.toString();

                    updateDisplay();

                } catch (e) {

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

                if (expression === "") {
                    expression = "-";
                } else if (expression.startsWith("-")) {
                    expression = expression.substring(1);
                } else {
                    expression = "-" + expression;
                }

                updateDisplay();
                break;

        }

    });

});
