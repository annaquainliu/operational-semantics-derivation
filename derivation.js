const input = document.getElementById('input');
const button  = document.getElementById('derive');
const latexOutput = document.getElementById("latex");
const variables = document.getElementsByClassName('variable');

let xi = {};
let rho = {};

let inferenceRules;
let startingFormat, endingFormat;
let Queue = [];
const numberDerivationsCap = 50;
let numberDerivations = 0;

window.onload = () => {
    fetch('impcore-inferenceRules.json')
        .then(response => response.json())
        .then(result => {inferenceRules = result});
    document.getElementById("output").style.display = 'none';
    fetch('format.json')
        .then(response => response.json())
        .then(result => {
            startingFormat = result.startingFormat;
            endingFormat = result.endingFormat;
    });
}

function isValidName(name) {
    if (name.startsWith("$")) {
        alert(`You cannot start your variable name with a '$'.`);
        return false;
    }
    let invalidWords = ['begin', 'if', 'set', 'while', 'val', '+', '-', "/", "=", "*"];
    if (invalidWords.includes(name)) {
        alert(`You cannot name your variable '${name}', as it is an Impcore keyword.`);
        return false;
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
        const name = nameField.value.replaceAll(" ", "");
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
    numberDerivations = 0;
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
        latexOutput.innerText = startingFormat + derivation.derivation + endingFormat;
        window.location.href = "#output";
        document.getElementById("output").style.display = 'block';
    } catch ({name, message}) {
        console.log(message);
        if (message == "Nested derivation is too deep.") {
            alert(`The derivation has over the max amount of layers (${numberDerivationsCap}).`);
        } else {
            alert(`Improper Impcore expression!`);
        }
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
            const char = input[index];
            if (char == "(") {
                index++;
                queueHelper(input, "", null);
                if (beginAmount != null) { //count the nested exp
                    beginAmount++;
                }
            } 
            else if (char == ")" || char == " ") {
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
                if (beginAmount != null && char == ")") {
                    Queue[beginIndexes.pop()] = `$begin${beginAmount.toString()}`;
                }
                index++;
                if (char == ")") {
                    return;
                }
            }
            else {
                string += char;
                index++;
            }
        }
        //no parenthesis
        if (string != "") {
            Queue.push(string);
        }
    }
}
// ticks carry the ticks from before
function derive(exp, execute, ticks) {

    numberDerivations++;
    if (numberDerivations > numberDerivationsCap) {
        throw new Error("Nested derivation is too deep.");
    }
    if (/^\d+$/.test(exp)) {
        return LIT(parseInt(exp), execute, ticks);
    }
    if (exp.startsWith("$begin")) {
        return BEGIN(exp, execute, ticks);
    }
    switch (exp) {
        case "if":
            return IF(execute, ticks);
        case "set":
            return SET(execute, ticks);
        case "while":
            return _WHILE(execute, ticks, true);
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
                                                   eqString : "$v_1 > $v_2 = $v_r"});
        case "<":
            return PRIMITIVE(exp, execute, ticks, {name : 'Lt', 
                                                    equation : (f, s) => f < s ? 1 : 0,
                                                    eqString : "$v_1 < $v_2 = $v_r"});
        default:
           return VAR(exp, execute, ticks);
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

function addTicks(derivation, ticks, match, execute) {
    if (!execute) {
        return "";
    }
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

function LIT(number, execute, ticks) {
    let derivation = inferenceRules.literal;
    if (execute) {
        derivation = derivation.replaceAll("$v", number);
        derivation = addTicks(derivation, ticks, "_1", execute);
    }
    return {"syntax" : `Literal(${number})`, 
            "value" : number,
            "derivation" : derivation,
            "impcore" : [number]};
}

function VAR(name, execute, ticks) {
    let variable = findVarInfo(name);
    let derivation = inferenceRules.var;
    if (execute) {
        if (variable.env == "rho") {
            derivation = derivation.replace("{Var}", "{FormalVar}");
            derivation = derivation.replaceAll("$scope", "$x \\in dom \\rho_1");
        } else if (variable.env == "xi") {
            derivation = derivation.replace("{Var}", "{GlobalVar}");
            derivation = derivation.replaceAll("$scope", "$x \\notin dom \\rho_1 \\and $x \\in dom \\xi_1");
        }
        derivation = derivation.replaceAll("$x", name);
        derivation = derivation.replaceAll("$env", `${variable.env}_1`);
        derivation = addTicks(derivation, ticks, "_1", execute);
    }
    return {"syntax" : `Var(${name})`, 
            "value" : variable.value, 
            "derivation" : derivation,
            "name" : name,
            "impcore" : [name]};
}

function IF(execute, ticks) {
    let syntax = "If(e_1, e_2, e_3)";
    let value;
    let derivation = inferenceRules.if;
    derivation = addTicks(derivation, ticks, "_1", execute); 
    const condition = derive(Queue.pop(), execute, ticks);
    const trueCase = derive(Queue.pop(), condition.value != 0 && execute, ticks);
    const falseCase = derive(Queue.pop(), condition.value == 0 && execute, ticks);
     //ticks obj is changed by reference
    derivation = addTicks(derivation, ticks, "_2", execute);

    function editDerivation(title, equal, branch) {
        derivation = derivation.replace("{If}", title)
                                .replace("?=", equal)
                                .replace("$eval_result", branch.derivation)
                                .replace("$v_r", branch.value);
        value = branch.value;
    }
    syntax = syntax.replace("e_1", condition.syntax).replace("e_2", trueCase.syntax).replace("e_3", falseCase.syntax);
    if (execute) {
        if (condition.value == 0) {
            editDerivation("{IfFalse}", "=", falseCase);
        } else {
            editDerivation("{IfTrue}", "\\neq", trueCase);
        }
        derivation = derivation.replace("$v_1", condition.value)
                               .replace("$eval_cond", condition.derivation)
                               .replace("$syntax", syntax);
    }   
    let impcore = ['if'].concat(condition.impcore).concat(trueCase.impcore).concat(falseCase.impcore);
    return {"syntax" : syntax, 
            "value" : value, 
            "derivation" : derivation,
            "impcore" : impcore};
}

function SET(execute, ticks) {
    let derivation  = inferenceRules.set;
    const beforeTicks = ticks;
    //ticks are changed from the derive process
    const variable = derive(Queue.pop(), execute, ticks); 
    const exp = derive(Queue.pop(), execute, ticks);
    const env = findVarInfo(variable.name).env;
    if (execute) {
        if (env == "rho") {
            derivation = derivation.replace("$Scope", `${variable.name} \\in dom \\rho_1`);
            derivation = derivation.replace("{Assign}", "{FormalAssign}");
        } else {
            derivation = derivation.replace("$Scope", `${variable.name} \\notin dom \\rho_1 \\and ${variable.name} \\in dom \\xi_1`);
            derivation = derivation.replace("{Assign}", "{GlobalAssign}");
        }
        derivation = addTicks(derivation, beforeTicks, "_1", execute);
        let environment = {"rho" : rho, "xi" : xi};
        environment[env][variable.name] = exp.value;
        //add the tick for the change in environment and assign formal title
        derivation = derivation.replace(`\\${env}_2`, `\\${env}_2\\{${variable.name}\\mapsto${exp.value}\\}`);
        derivation = addTicks(derivation, ticks, "_2", execute);
        ticks[`${env}_ticks`]++;
        derivation = derivation.replace("$exp_derivation", exp.derivation)
                               .replace("$x", variable.syntax)
                               .replace("$e", exp.syntax)
                               .replace("$v", exp.value);
    }
    return {"syntax" : `Set(${variable.syntax}, ${exp.syntax})`,
            "value" : exp.value,
            "derivation" : derivation,
            "impcore" : ['set'].concat(variable.impcore).concat(exp.impcore)};
}

function BEGIN(exp, execute, ticks) {

    const n_amnt = parseInt(exp.split("$begin")[1]);
    let value = 0;
    let exps_syntax = "";
    let derivation = inferenceRules.begin;
    let exps_derivations = "";
    let expression;
    let impcore = [exp];
    derivation = addTicks(derivation, ticks, "_1", execute);
    for (let i = 0; i < n_amnt; i++) {
        expression = derive(Queue.pop(), execute, ticks);
        exps_syntax += expression.syntax + ", ";
        exps_derivations += "  \\\\\\\\ " + expression.derivation;
        impcore = impcore.concat(expression.impcore);
    }
    derivation = addTicks(derivation, ticks, "_2", execute);
    exps_syntax = exps_syntax.substring(0, exps_syntax.length - 2);
    let syntax = `Begin(${exps_syntax})`;
    if (execute) {
        if (n_amnt == 0) {
            derivation = derivation.replace("{Begin}", "{EmptyBegin}");
            exps_derivations = " \\ ";
        }
        else {
            value = expression.value;
        }
         //begin result value is the last expression's value
        derivation = derivation.replace("$v_r", value).replace("$exps", exps_syntax)
                                                      .replace("$derivations", exps_derivations);
    }

    return {"syntax" : syntax,
            "value" : value,
            "derivation" : derivation,
            "impcore" : impcore};
}

function PRIMITIVE(exp, execute, ticks, functionInfo) {
    let derivation = inferenceRules.applyPrimitive;
    derivation = addTicks(derivation, ticks, "_1", execute);
    derivation = derivation.replaceAll("$eqString", functionInfo.eqString);
    const first = derive(Queue.pop(), execute, ticks);
    const second = derive(Queue.pop(), execute, ticks);
    const result = functionInfo.equation(first.value, second.value);
    derivation = addTicks(derivation, ticks, "_2", execute);
    let syntax = `Apply(${exp}, ${first.syntax}, ${second.syntax})`;
    if (execute) {
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
        derivation = derivation.replaceAll("$f", exp)
                                .replaceAll("$e_1_derivation", first.derivation)
                                .replaceAll("$e_2_derivation", second.derivation)
                                .replaceAll("$v_1", first.value)
                                .replaceAll("$v_2", second.value)
                                .replaceAll("$v_r", result)
                                .replace("$syntax", syntax);
    }

    return {"syntax" : syntax,
            "value" : result,
            "derivation" : derivation,
            'impcore' : [exp].concat(first.impcore).concat(second.impcore)};
}



function _WHILE(execute, ticks, first) {
    function editWhileRule(derivation, ticks, first, title, exp_derivation) {
        if (!first) {
            derivation = addTicks(derivation, ticks, "_2", true);
        }
        derivation = derivation.replace("{While}", title);
        derivation = derivation.replace("$exp_derivation", exp_derivation);
        return derivation;
    }
    let derivation = inferenceRules.while;
    derivation = addTicks(derivation, ticks, "_1", execute);
    let condition = derive(Queue.pop(), execute, ticks);
    let expression; // execute the expression only if condition is true
    const beforeQueue = Queue;
    if (execute) {
        derivation = derivation.replace("$cond_derivation", condition.derivation)
                               .replace("$cond_value", condition.value);
        expression = derive(Queue.pop(), condition.value != 0, ticks);
        if (condition.value == 0) {
            derivation = editWhileRule(derivation, ticks, first, "{WhileEnd}", "");
            derivation = derivation.replace("\\neq", "=");
            derivation = derivation.replace("$next_while", "");
        } 
        else {
            derivation = editWhileRule(derivation, ticks, first, "{WhileIterate}", expression.derivation);
            Queue = condition.impcore.concat(expression.impcore).reverse();
            derivation = derivation.replace("$next_while", _WHILE(execute, ticks, false).derivation);
        }
        if (first) {
            derivation = addTicks(derivation, ticks, "_2", execute);
        }
        derivation = derivation.replace("$syntax", `While(${condition.syntax}, ${expression.syntax})`);
    } 
    else {
        expression = derive(Queue.pop(), false, ticks);
    }
    Queue = beforeQueue;
    return {"syntax" : `While(${condition.syntax}, ${expression.syntax})`,
            "value" : 0,
            "derivation": derivation,
            "impcore" : ['while'].concat(condition.impcore).concat(expression.impcore)};
}