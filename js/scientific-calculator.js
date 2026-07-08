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

        if (value !== undefined) {

            expression += value;
            updateDisplay();
            return;

        }

        switch(action){

            case "clear":

                expression = "";
                updateDisplay();
                break;

            case "backspace":

                expression = expression.slice(0,-1);
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

                if(expression.startsWith("-")){
                    expression = expression.substring(1);
                }else{
                    expression = "-" + expression;
                }

                updateDisplay();

                break;

            case "equals":

                try{

                    const result = math.evaluate(expression);

                    expression = result.toString();

                    updateDisplay();

                }catch{

                    display.value = "Error";

                    expression = "";

                }

                break;

        }

    });

});

/* ========================= */
/* Keyboard Support */
/* ========================= */

document.addEventListener("keydown",(e)=>{

    const key = e.key;

    if("0123456789+-*/().%".includes(key)){

        expression += key;

        updateDisplay();

    }

    else if(key==="Enter"){

        e.preventDefault();

        try{

            expression = math.evaluate(expression).toString();

            updateDisplay();

        }catch{

            display.value="Error";

            expression="";

        }

    }

    else if(key==="Backspace"){

        expression = expression.slice(0,-1);

        updateDisplay();

    }

    else if(key==="Escape"){

        expression="";

        updateDisplay();

    }

});
