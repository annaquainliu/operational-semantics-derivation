const input = document.getElementById('input');
const button  = document.getElementById('derive');
const xiInput = document.getElementById('xi');
const rhoInput = document.getElementById('rho');
const latexOutput = document.getElementById("latex");

let xi = {};
let rho = {};

let inferenceRules;
let Queue = [];

window.onload = () => {
    fetch('impcore-inferenceRules.json')
    .then(response => response.json())
    .then(result => {inferenceRules = result});
}

button.addEventListener('click', () => {
    xi = addVariables(xiInput.value);
    rho = addVariables(rhoInput.value);
    let value = input.value.toLowerCase();
    if (value == "" || value == null) {
        alert("Ill-formed Impcore expression");
        return;
    }
    addValuesToQueue(value);
    const derivation = derive(Queue.pop(), true);
    console.log("derivation is", derivation);
    latexOutput.innerText = derivation.derivation;
});

function addValuesToQueue(input) {
    input = input.replaceAll("(", "");
    input = input.replaceAll(")", "");
    Queue = input.split(" ").reverse();
    console.log("queue is ", Queue);
}

function addVariables(input) {
    // console.log(input);
    let env = {};
    let vars = input.split(',');
    for (let i = 0; i < vars.length; i++) {
        let variable = vars[i].split('=');
        //change this line later
        env[variable[0]] = parseInt(variable[1]); 
    }
    return env;
}

function derive(exp, execute) {

    if (/^\d+$/.test(exp)) {
        return LIT(parseInt(exp));
    }
   
    switch (exp) {
        case "if":
            return IF(execute);
        case "set":
            return SET(execute);
        //     break;
        // case "begin":
        //     return BEGIN();
        default:
           return VAR(exp);
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

function findVarInfo(variable) {

    let environments = {"rho" : rho, "xi" : xi}
    for (const name in environments) {
        let value = searchEnv(variable, environments[name]);
        if (value != null) {
            return {env : name, "value" : value};
        } 
    }
    throw new Error(`${variable} cannot be found in either xi or rho.`);
    
}

function LIT(number) {
    let derivation = inferenceRules.literal;
    derivation = derivation.replaceAll("$v", number);
    return {"syntax" : `Literal(${number})`, 
            "value" : number,
            "derivation" : derivation};
}

function VAR(name) {
    let variable = findVarInfo(name);
    let derivation = inferenceRules.var;
    derivation = derivation.replaceAll("$x", name);
    if (variable.env == "rho") {
        derivation = derivation.replace("{Var}", "{FormalVar}");
        derivation = derivation.replaceAll("$env", "\\rho");
    } else if (variable.env == "xi") {
        derivation = derivation.replace("{Var}", "{GlobalVar}");
        derivation = derivation.replaceAll("$env", "\\xi");
    }

    return {"syntax" : `Var(${name})`, 
            "value" : variable.value, 
            "derivation" : derivation,
            "name" : name};
}

function IF(execute) {
    const condition = derive(Queue.pop(), execute);
    const trueCase = derive(Queue.pop(), condition.value != 0 && execute);
    const falseCase = derive(Queue.pop(), condition.value == 0 && execute);
    let derivation = inferenceRules.if;
    let syntax = "If(e_1, e_2, e_3)";
    let value;

    function editDerivation(title, equal, branch) {
        derivation = derivation.replace("{If}", title);
        derivation = derivation.replace("?=", equal);
        derivation = derivation.replace("$eval_result", branch.derivation);
        derivation = derivation.replace("$v_r", branch.value);
        value = branch.value;
    }
    if (condition.value == 0) {
        editDerivation("{IfFalse}", "=", falseCase);
    } else {
       editDerivation("{IfTrue}", "\\neq", trueCase);
    }
    derivation = derivation.replace("$v_1", condition.value);
    derivation = derivation.replace("$eval_cond", condition.derivation);
    syntax = syntax.replace("e_1", condition.syntax);
    syntax = syntax.replace("e_2", trueCase.syntax);
    syntax = syntax.replace("e_3", falseCase.syntax);
    derivation = derivation.replace("$syntax", syntax);
    return {"syntax" : syntax, "value" : value, "derivation" : derivation};
}

function SET(execute) {
    const variable = derive(Queue.pop());
    const exp = derive(Queue.pop());
    let derivation  = inferenceRules.set;
    console.log(variable);
    const env = findVarInfo(variable.name).env;
    if (execute) {  
        let environment = {"rho" : rho, "xi" : xi};
        environment[env][variable.name] = exp.value;
    }
    let rho_tick = 0; let xi_tick = 0;
    if (env == "rho") {
        derivation = derivation.replace("{Assign}", "{FormalAssign}");
    } 
    else {
        derivation = derivation.replace("{Assign}", "{GlobalAssign}");
    }
    derivation = derivation.replace("$Scope", `${variable.name} \\in dom \\${env}`);
    derivation = derivation.replace("$exp_derivation", exp.derivation);
    derivation = derivation.replace("$x", variable.syntax);
    derivation = derivation.replace("$e", exp.syntax);
    derivation = derivation.replace("$v", exp.value);

    return {"syntax" : `Set(${variable.syntax}, ${exp.syntax})`,
            "value" : exp.value,
            "derivation" : derivation}
}