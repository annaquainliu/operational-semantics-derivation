const input = document.getElementById('input');
const button  = document.getElementById('derive');
const latexOutput = document.getElementById("latex");
const variables = document.getElementsByClassName('variable');

let xi = {};
let rho = {};

let inferenceRules;
let Queue = [];

window.onload = () => {
    fetch('impcore-inferenceRules.json')
    .then(response => response.json())
    .then(result => {inferenceRules = result});
    document.getElementById("output").style.display = 'none';
}

function isValidName(name) {
    if (name.startsWith("$")) {
        return false;
    }
    let invalidWords = ['begin', 'if', 'set', 'while', 'val', '+', '-', "/", "=", "*"];
    for (let i = 0; i < invalidWords.length; i++) {
        if (invalidWords[i] == name) {
            alert(`You cannot name your variable '${name}', as it is an Impcore keyword.`);
            return false;
        }
    }
    return true;
}

Array.prototype.forEach.call(variables, variableDiv => {
    const variableInfo = variableDiv.getElementsByClassName('variable_info')[0];
    const addVariable = variableDiv.getElementsByClassName('add_variable')[0];
    const button = variableDiv.getElementsByTagName('button')[0];
    const env = variableDiv.getAttribute('value');
    const nameField = variableDiv.querySelector("input[name='name']");
    const valueField = variableDiv.querySelector("input[name='value']");

    addVariable.addEventListener('click', () => {
        if (variableInfo.style.display == "none" || variableInfo.style.display == "") {
            variableInfo.style.display = "flex";
        } else {
            variableInfo.style.display = "none";
        }
    });
    button.addEventListener('click', () => {
        const name = nameField.value;
        const value = valueField.value;
        if (name == "" || value == "") {
            alert("Please fill in the name and the value of the variable");
            return;
        }
        if (!isValidName(name)) {
            return;
        }
        let currentValue = document.getElementById(env).value;
        let addOn = "";
        if (currentValue == " {}") {
            addOn = `${name} → ${value}}`
        } else {
            addOn = `, ${name} → ${value}}`
        }
        document.getElementById(env).value = currentValue.substring(0, currentValue.length - 1) + addOn;
    });
});

function addVariablesToEnv() {
    xi = {}; rho = {}; // clear environments
    let environments = {"xi" : xi, "rho" : rho};
    ["rho", "xi"].forEach(env => {
        let variables = document.getElementById(env).value;
        variables = variables.replaceAll(" ", "");
        variables = variables.substring(1, variables.length - 1);
        const maps = variables.split(',');
        maps.forEach(mapping => {
            const fields = mapping.split('→');
            const name = fields[0];
            const value = fields[1];
            environments[env][name] = parseInt(value);
        });
    });
    console.log(xi);
    console.log(rho);
}
//derive
button.addEventListener('click', () => {
    addVariablesToEnv();
    let value = input.value.toLowerCase();
    if (value == "" || value == null) {
        alert("Ill-formed Impcore expression");
        return;
    }
    //clear queue and the environments
    Queue = [];
    addValuesToQueue(value);
    console.log(Queue);
    try {
        const derivation = derive(Queue.pop(), true, {"rho_ticks" : 0, "xi_ticks" : 0});
        console.log("derivation is", derivation);
        latexOutput.innerText = derivation.derivation;
        window.location.href = "#output";
        document.getElementById("output").style.display = 'block';
    } catch (error) {
        alert(`Improper Impcore expression!`);
        return;
    }
});

function addValuesToQueue(value) {
    let index = 0;
    let beginIndexes = [];
    queueHelper(value, "", null);
    Queue.reverse();

    function queueHelper(input, string, beginAmount) {
        while (index < input.length) {
            if (input[index] == "(") {
                index++;
                queueHelper(input, "", null);
                if (beginAmount != null) {
                    beginAmount++;
                }
            } 
            else if (input[index] == ")") {
                if (string != "") {
                    Queue.push(string);
                    string = "";
                    if (beginAmount != null) {
                        beginAmount++;
                    }
                }
                if (beginAmount != null) {
                    Queue[beginIndexes.pop()] += beginAmount.toString();
                }
                index++;
                return;
            } 
            else if (input[index] == " ") {
                if (string == "begin") {
                    beginIndexes.push(Queue.length);
                    beginAmount = 0;
                }
                else if (beginAmount != null && string != "") {
                    beginAmount++;
                }
                if (string != "") {
                    Queue.push(string);
                    string = "";
                }
                index++;
            } 
            else {
                string += input[index];
                index++;
            }
        }
        //no parenthesis
        if (string != null) {
            Queue.push(string);
        }
    }
}
// ticks carry the ticks from before
function derive(exp, execute, ticks) {

    if (/^\d+$/.test(exp)) {
        return LIT(parseInt(exp), ticks);
    }
    if (exp.startsWith("begin")) {
        return BEGIN(exp, execute, ticks);
    }
    switch (exp) {
        case "if":
            return IF(execute, ticks);
        case "set":
            return SET(execute, ticks);
        case "+":
            return PRIMITIVE(exp, execute, ticks, {name : 'Add', 
                                                   equation : (f, s) => f + s, 
                                                   eqString : "-2^{31} \\leq $v_1 $f $v_2 < 2^{31}"});
        case "-":
            return PRIMITIVE(exp, execute, ticks, {name : 'Sub', 
                                                   equation : (f, s) => f - s,
                                                   eqString : "-2^{31} \\leq $v_1 $f $v_2 < 2^{31}"});
        case "/":
            return PRIMITIVE(exp, execute, ticks, {name : 'Div', 
                                                   equation : (f, s) => Math.floor(f / s),
                                                   eqString : "-2^{31} \\leq $v_1 $f $v_2 < 2^{31}"});
        case "*":
            return PRIMITIVE(exp, execute, ticks, {name : 'Mult', 
                                                   equation : (f, s) => f * s,
                                                   eqString : "-2^{31} \\leq $v_1 $f $v_2 < 2^{31}"});
        case "=":
            return PRIMITIVE(exp, execute, ticks, {name : 'Eq', 
                                                   equation : (f, s) => f == s ? 1 : 0,
                                                   eqString : "$v_1 ?= $v_2"});
        case ">":
            return PRIMITIVE(exp, execute, ticks, {name : 'Gt', 
                                                   equation : (f, s) => f > s ? 1 : 0,
                                                   eqString : "$v_r = $v_1 > $v_2"});
        case "<":
            return PRIMITIVE(exp, execute, ticks, {name : 'Lt', 
                                                    equation : (f, s) => f < s ? 1 : 0,
                                                    eqString : "$v_r = $v_1 < $v_2"});
        default:
           return VAR(exp, ticks);
    }
}

// UTILITIES

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

function addTicks(derivation, ticks, match) {
    //rho, xi
    for (const key in ticks) {
        let env = key.split('_')[0];
        if (ticks[key] == 0) {
            derivation = derivation.replaceAll(env + match, env + "");
        } else {
            derivation = derivation.replaceAll(env + match, env + "'".repeat(ticks[key]));
        }
    }
    return derivation;
}
// END OF UTILITIES

function LIT(number, ticks) {
    let derivation = inferenceRules.literal;
    derivation = derivation.replaceAll("$v", number);
    derivation = addTicks(derivation, ticks, "_1");
    return {"syntax" : `Literal(${number})`, 
            "value" : number,
            "derivation" : derivation};
}

function VAR(name, ticks) {
    let variable = findVarInfo(name);
    let derivation = inferenceRules.var;
    derivation = derivation.replaceAll("$x", name);
    if (variable.env == "rho") {
        derivation = derivation.replace("{Var}", "{FormalVar}");
        derivation = derivation.replaceAll("$env", "\\rho_1");
    } else if (variable.env == "xi") {
        derivation = derivation.replace("{Var}", "{GlobalVar}");
        derivation = derivation.replaceAll("$env", "\\xi_1");
    }
    derivation = addTicks(derivation, ticks, "_1");
    return {"syntax" : `Var(${name})`, 
            "value" : variable.value, 
            "derivation" : derivation,
            "name" : name};
}

function IF(execute, ticks) {
    let derivation = inferenceRules.if;
    let syntax = "If(e_1, e_2, e_3)";
    let value;
    derivation = addTicks(derivation, ticks, "_1"); 
    const condition = derive(Queue.pop(), execute, ticks);
    const trueCase = derive(Queue.pop(), condition.value != 0 && execute, ticks);
    const falseCase = derive(Queue.pop(), condition.value == 0 && execute, ticks);
     //ticks obj is changed by reference
    derivation = addTicks(derivation, ticks, "_2");

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
    return {"syntax" : syntax, 
            "value" : value, 
            "derivation" : derivation};
}

function SET(execute, ticks) {
    let derivation  = inferenceRules.set;
    derivation = addTicks(derivation, ticks, "_1");
    //ticks are changed from the derive process
    const variable = derive(Queue.pop(), execute, ticks); 
    const exp = derive(Queue.pop(), execute, ticks);
    const env = findVarInfo(variable.name).env;
    if (execute) {  
        let environment = {"rho" : rho, "xi" : xi};
        environment[env][variable.name] = exp.value;
        //add the tick for the change in environment and assign formal title
        if (env == "rho") {
            derivation = derivation.replace("{Assign}", "{FormalAssign}");
        } 
        else {
            derivation = derivation.replace("{Assign}", "{GlobalAssign}");
        }
        derivation = derivation.replace(`\\${env}_2`, `\\${env}_2\\{${variable.name}\\mapsto${exp.value}\\}`);
    }
    derivation = addTicks(derivation, ticks, "_2");
    if (execute) {
        ticks[`${env}_ticks`]++;
    }
    derivation = derivation.replace("$Scope", `${variable.name} \\in dom \\${env}`);
    derivation = derivation.replace("$exp_derivation", exp.derivation);
    derivation = derivation.replace("$x", variable.syntax);
    derivation = derivation.replace("$e", exp.syntax);
    derivation = derivation.replace("$v", exp.value);

    return {"syntax" : `Set(${variable.syntax}, ${exp.syntax})`,
            "value" : exp.value,
            "derivation" : derivation};
}

function BEGIN(exp, execute, ticks) {

    const n_amnt = parseInt(exp.split("begin")[1]);
    let exps_syntax = "";
    let derivation = inferenceRules.begin;
    let exps_derivations = "";
    let expression;
    derivation = addTicks(derivation, ticks, "_1");
    for (let i = 0; i < n_amnt; i++) {
        expression = derive(Queue.pop(), execute, ticks);
        exps_syntax += expression.syntax + ", ";
        exps_derivations += "  \\\\\\\\ " + expression.derivation;
    }
    derivation = addTicks(derivation, ticks, "_2");
    exps_syntax = exps_syntax.substring(0, exps_syntax.length - 1);
    let syntax = `Begin(${exps_syntax})`
    //begin result value is the last expression's value
    derivation = derivation.replace("$v_r", expression.value); 
    derivation = derivation.replace("$exps", exps_syntax);
    derivation = derivation.replace("$derivations", exps_derivations);

    return {"syntax" : syntax,
            "value" : expression.value,
            "derivation" : derivation};
}

function PRIMITIVE(exp, execute, ticks, functionInfo) {
    let derivation = inferenceRules.applyPrimitive;
    derivation = addTicks(derivation, ticks, "_1");
    derivation = derivation.replaceAll("$eqString", functionInfo.eqString);
    const first = derive(Queue.pop(), execute, ticks);
    const second = derive(Queue.pop(), execute, ticks);
    const result = functionInfo.equation(first.value, second.value);
    derivation = addTicks(derivation, ticks, "_2");

    if (exp == "=") {
        if (result == 0) {
            derivation = derivation.replace("{Apply}", "{ApplyEqFalse}");
            derivation = derivation.replace("?=", "\\neq");
        } else {
            derivation = derivation.replace("{Apply}", "{ApplyEqTrue}");
            derivation = derivation.replace("?=", "=");
        }
    } else {
        derivation = derivation.replace("{Apply}", `{Apply${functionInfo.name}}`);
    }
    derivation = derivation.replaceAll("$f", exp);
    derivation = derivation.replaceAll("$e_1_derivation", first.derivation);
    derivation = derivation.replaceAll("$e_2_derivation", second.derivation);
    derivation = derivation.replaceAll("$v_1", first.value);
    derivation = derivation.replaceAll("$v_2", second.value);
    derivation = derivation.replaceAll("$v_r", result);
    let syntax = `Apply(${exp}, ${first.syntax}, ${second.syntax})`;
    derivation = derivation.replace("$syntax", syntax);

    return {"syntax" : syntax,
            "value" : result,
            "derivation" : derivation};
}