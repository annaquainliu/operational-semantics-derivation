const input = document.getElementById('input');
const button  = document.getElementById('button');
const kseeInput = document.getElementById('ksee');
const rhoInput = document.getElementById('rho');
const latexOutput = document.getElementById("latex");

ksee = {};
rho = {};
inferenceRules = {};
latex = [];

window.onload = () => {
    fetch('impcore-inferenceRules.json')
    .then(response => response.json())
    .then(result => {inferenceRules = result});
}

button.addEventListener('click', () => {
    ksee = addVariables(kseeInput.value);
    rho = addVariables(rhoInput.value);
    console.log(ksee, rho);
    validate(input.value);
});

function addVariables(input) {
    console.log(input);
    let env = {};
    let vars = input.split(',');
    for (let i = 0; i < vars.length; i++) {
        let variable = vars[i].split('=');
        //change this line later
        env[variable[0]] = parseInt(variable[1]); 
    }
    return env;
}

function validate(input) {
    if (input == "" || input == null || input[0] != "(" || input[input.length - 1] != ")") {
        alert("Ill-formed Impcore expression");
        return;
    }
    input = input.substr(1, input.length - 2);
    if (input[0] == '(' || input[input.length - 1] == ')') {
        alert("Too many brackets!");
        return;
    }
    if (input.includes('while')) {
        alert("How dare you use WHILE in Impcore...");
        return;
    }
    input = input.toLowerCase();
    interpret(input);
    latexOutput.innerText = latex[0];
}

function interpret(input) {
    // if 0 0 0
    let exp = input.split(' ');
    //get ifTrue
    let expKeyWord = exp[0];
    //if it is a literal
    if (/^\d+$/.test(expKeyWord)) {
        return { "type" : "LITERAL", "val" : parseInt(expKeyWord)};
    }
    //idk if u can make a hashmap of strings to parameterized functions
    switch (expKeyWord) {
        case "if":
            return IF(exp);
        case "set":
            return SET(exp);
        case "begin":
            return BEGIN(exp);
        default:
           return VAR(exp);
    }

}

function appendRuleToLatex(rule) {
   latex.push(rule);
}

function IF(exp) {
    //if false
    let inferule = inferenceRules["if"];
    //only need certain conditions, no need to fully recurse on a branch
    let condResult = interpret(exp[1]);
    inferule = inferule.replaceAll("e_1", `${condResult.type}(${condResult.val})`);
    inferule = inferule.replaceAll("v_1", condResult.val);
    let result;
    //if true
    if (condResult.val != 0) {
        result = interpret(exp[2]);
        inferule = inferule.replaceAll("{If}", "{IfTrue}");
    } else {
        result = interpret(exp[3]);
        inferule = inferule.replaceAll("{If}", "{IfFalse}");
    }
    inferule = inferule.replaceAll("v_r", result.val);
    if (rho != null) {
        inferule.replaceAll("/rho", "/rho" + JSON.stringify(rho));
    } 
    if (ksee != null) {
        inferule.replaceAll("/xi", "/xi" + JSON.stringify(ksee));
    }
    appendRuleToLatex(inferule);
    return result;
}