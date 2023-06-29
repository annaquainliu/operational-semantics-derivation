const input = document.getElementById('input');
const button  = document.getElementById('derive');
const xiInput = document.getElementById('xi');
const rhoInput = document.getElementById('rho');
const latexOutput = document.getElementById("latex");

let xi = {};
let rho = {};
//rho always shadows xi, order matters
let environments = {"rho" : rho, "xi" : xi};
let inferenceRules;
let interpretStack = [];
let derivedStack = [];

window.onload = () => {
    fetch('impcore-inferenceRules.json')
    .then(response => response.json())
    .then(result => {inferenceRules = result});
}

button.addEventListener('click', () => {
    xi = addVariables(xiInput.value);
    rho = addVariables(rhoInput.value);
    console.log(xi, rho);
    if (input.value == "" || input.value == null || input.value[0] != "(" || input.value[input.value.length - 1] != ")") {
        alert("Ill-formed Impcore expression");
        return;
    }
    input.value = input.value.toLowerCase();
    interpretStack.push(input.value);
    const derivation = derive();
    console.log("derivation is", derivation);
    latexOutput.innerText = derivation.derivation;
});

function derive() {
    try {
        while (!interpretStack.length == 0) {
            let exp = interpretStack.pop();
            console.log("exp is", `'${exp}'`);
            if (exp.startsWith("(")) {
                pushComponents(exp);
            } else { //must be root 
                interpret(exp);
            }
        }
        return derivedStack.pop();
    } catch(error) {
        return error;
    }
}

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

function pushComponents(input) {
    let currentExp = "";
    for (let i = 0; i < input.length; i++) {
        if (input[i] == "(") {
            currentExp = "";
        } 
        else if (input[i] == " " || input[i] == ")" ) {
            if (currentExp != "") {
                interpretStack.push(currentExp);
            }
            currentExp = "";
        } 
        else {
            currentExp += input[i];
        }
    }
    return input;
}

function interpret(input) {
    //if it is a literal
    if (/^\d+$/.test(input)) {
        console.log(input, "is a literal");
        LIT(parseInt(input));
        return;
    }
   
    switch (input) {
        case "if":
            IF();
            break;
        case "set":
            SET();
            break;
        // case "begin":
        //     return BEGIN();
        default:
           VAR(input);
    }
}


function searchEnv(variable, env) {
    for (const key in env) {
        if (key == variable) {
            return env[variable];
        }
    }
    return null;
}

function findEnv(variable) {

    for (const name in environments) {
        let value = searchEnv(variable, environments[name]);
        if (value != null) {
            return {env : name, "value" : value};
        } 
    }
    throw new Error(`${variable} cannot be found in either xi or rho.`);
    
}

function addPreviousTicks(source, destination) {
    let ticks = {"rho_ticks" : 0, "xi_ticks" : 0};
    for (const type in ticks) {
        if (source[type] != null) {
            let env = type.split('_')[0];
            destination = destination.replace(`\\${env}''`, `\\${env}${"'".repeat(source[type])}`);
            ticks[type] = source[type];
        }
    }
    ticks["derivation"] = destination;
    return ticks;
}

function LIT(input) {
    let derivation = inferenceRules.literal;
    derivation = derivation.replaceAll("$v", input);
    derivedStack.push({ "syntax" : `Literal(${input})`, 
                        "value" : input,
                        "derivation" : derivation});
}

function VAR(input) {
    let variable = findEnv(input);
    let derivation = inferenceRules.var;
    derivation = derivation.replaceAll("$x", input);
    if (variable.env == "rho") {
        derivation = derivation.replace("{Var}", "{FormalVar}");
        derivation = derivation.replaceAll("$env", "\\rho");
    } else if (variable.env == "xi") {
        derivation = derivation.replace("{Var}", "{GlobalVar}");
        derivation = derivation.replaceAll("$env", "\\xi");
    }

    derivedStack.push({"syntax" : `Var(${input})`, 
                       "value" : variable.value, 
                       "derivation" : derivation,
                       "variable" : input});
}

function SET() {

    const variable = derivedStack.pop();
    const exp = derivedStack.pop();
    let varEnv = findEnv(variable.variable);
    let derivation = inferenceRules.set;
    derivation = derivation.replace("$Scope", `${variable.variable} \\in \\${varEnv.env}`);
    //displaying the editing of environments
    derivation = derivation.replace(`\\${varEnv.env}''`, `\\${varEnv.env}''\\{${variable.variable}\\mapsto${exp.value}\\}}`);
    let tickEnv = addPreviousTicks(exp, derivation);
    //to make sure that the extra tick is only added when the new value is different
    if (variable.value != exp.value) {
        tickEnv[`${varEnv.env}_ticks`] += 1;
        environments[`${varEnv.env}`][`${variable.variable}`] = exp.value; //setting value
    }
    derivation = tickEnv.derivation;
    derivation = derivation.replace("''", ""); //leftovers
    derivation = derivation.replaceAll("$e", exp.derivation);
    derivation = derivation.replaceAll("$v", exp.value);
    derivation = derivation.replaceAll("$x", variable.variable);

    derivedStack.push({"syntax" : `Set(${variable.syntax},${exp.syntax})`,
                       "value" : varEnv.value,
                       "derivation" : derivation,
                       "rho_ticks" : tickEnv.rho_ticks,
                       "xi_ticks" : tickEnv.xi_ticks
                     });
}

function IF() {
    const condition = derivedStack.pop();
    const trueCase = derivedStack.pop();
    const falseCase = derivedStack.pop();

    let derivation = inferenceRules.if;
    let syntax = "If(e_1, e_2, e_3)";
    let value;
    if (condition.value == 0) {
        derivation = derivation.replace("{If}", "{IfFalse}");
        derivation = derivation.replace("?=", "=");
        derivation = derivation.replace("$eval_result", falseCase.derivation);
        value = falseCase.value;
    } else {
        derivation = derivation.replace("{If}", "{IfTrue}");
        derivation = derivation.replace("?=", "\\neq");
        derivation = derivation.replace("$eval_result", trueCase.derivation);
        value = trueCase.value;
    }
    derivation = derivation.replace("$v_1", condition.value);
    derivation = derivation.replace("$v_r", value);
    derivation = derivation.replace("$eval_cond", condition.derivation);
    syntax = syntax.replace("e_1", condition.syntax);
    syntax = syntax.replace("e_2", trueCase.syntax);
    syntax = syntax.replace("e_3", falseCase.syntax);
    derivation = derivation.replace("$syntax", syntax);
    derivedStack.push({"syntax" : syntax, "value" : value, "derivation" : derivation});
}