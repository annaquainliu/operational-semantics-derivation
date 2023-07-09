const input = document.getElementById('input');
const button  = document.getElementById('derive');
const latexOutput = document.getElementById("latex");
const variables = document.getElementsByClassName('variable');
import Latex from './latexRenderer/latex.js';

let xi = {};
let rho = {};

let startingFormat, endingFormat;
let Queue = [];
const numberDerivationsCap = 50;
let numberDerivations = 0;

window.onload = () => {
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
    let invalidWords = ['begin', 'if', 'set', 'while', 'val', '+', '-', "/", "=", "*", "||", "&&", "mod"];
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
    if (!isNaN(exp)) {
        console.log(exp + "is a number");
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
        case "&&":
            return PRIMITIVE("\\&\\&", execute, ticks, {name : "And",
                                                   equation : (f, s) => f && s ? 1 : 0,
                                                   eqString : "$v_1 \\textsc{ \\&\\& } $v_2 = $v_r"});
        case "||":
            return PRIMITIVE(exp, execute, ticks, {name : "Or",
                                                   equation : (f, s) => f || s ? 1 : 0,
                                                   eqString : "$v_1 \\textsc{ || } $v_2 = $v_r"});
        case "mod":
            return PRIMITIVE(exp, execute, ticks, {name : 'Mod',
                                                   equation: (f, s) => f % s,
                                                   eqString : "-2^{31} \\leq $v_1 \\textsc{ mod } $v_2 < 2^{31}"})
        case "+":
            return PRIMITIVE(exp, execute, ticks, {name : 'Add', 
                                                   equation : (f, s) => f + s, 
                                                   eqString : "-2^{31} \\leq $v_1 + $v_2 < 2^{31}"});
        case "-":
            return PRIMITIVE(exp, execute, ticks, {name : 'Sub', 
                                                   equation : (f, s) => f - s,
                                                   eqString : "-2^{31} \\leq $v_1 - $v_2 < 2^{31}"});
        case "/":
            return PRIMITIVE(exp, execute, ticks, {name : 'Div', 
                                                   equation : (f, s) => Math.floor(f / s),
                                                   eqString : "-2^{31} \\leq $v_1 / $v_2 < 2^{31}"});
        case "*":
            return PRIMITIVE(exp, execute, ticks, {name : 'Mult', 
                                                   equation : (f, s) => f * s,
                                                   eqString : "-2^{31} \\leq $v_1 * $v_2 < 2^{31}"});
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
// END OF UTILITIES

function LIT(number, execute, ticks) {
    let derivation;
    if (execute) {
        derivation = Latex.LiteralLatex(number, ticks);
    }
    return {"syntax" : `Literal(${number})`, 
            "value" : number,
            "derivation" : derivation,
            "impcore" : [number]};
}

function VAR(name, execute, ticks) {
    let variable = findVarInfo(name);
    let derivation;
    console.log(ticks);
    const rhoTicks = Latex.ticks(ticks, 'rho');
    const xiTicks = Latex.ticks(ticks, 'xi');
    if (execute) {
        if (variable.env == "rho") {
            derivation = Latex.VarLatex('FormalVar', name, `${name} \\in dom \\rho${rhoTicks}`, 
                                        `$\\rho${rhoTicks}(${name})$`, ticks);
        } 
        else if (variable.env == "xi") {
            derivation = Latex.VarLatex('GlobalVar', name, `${name} \\notin dom \\rho${rhoTicks} \\and ${name} \\in \\xi${xiTicks}`,
                                        `$\\xi${xiTicks}(${name})$`, ticks);
        }
    }
    return {"syntax" : `Var(${name})`, 
            "value" : variable.value, 
            "derivation" : derivation,
            "name" : name,
            "impcore" : [name]};
}

function IF(execute, ticks) {
    let derivation, value;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    const condition = derive(Queue.pop(), execute, ticks);
    const trueCase = derive(Queue.pop(), condition.value != 0 && execute, ticks);
    const falseCase = derive(Queue.pop(), condition.value == 0 && execute, ticks);
    const syntax = `If(${condition.syntax}, ${trueCase.syntax}, ${falseCase.syntax})`;
     //ticks obj is changed by reference
    if (execute) {
        if (condition.value == 0) {
            value = falseCase.value;
            derivation = Latex.IfLatex("IfFalse", syntax, condition.derivation, 
                                        `${condition.value} = 0`, falseCase.derivation, 
                                        value, beforeTicks, ticks);
        } else {
            value = trueCase.value;
            derivation = Latex.IfLatex("IfTrue", syntax, condition.derivation, 
                                        `${condition.value} \\neq 0`, trueCase.derivation, 
                                        value, beforeTicks, ticks);
        }
    }   
    let impcore = ['if'].concat(condition.impcore).concat(trueCase.impcore).concat(falseCase.impcore);
    return {"syntax" : syntax, 
            "value" : value, 
            "derivation" : derivation,
            "impcore" : impcore};
}

function SET(execute, ticks) {
    let derivation;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    const rhoTicks = Latex.ticks(beforeTicks, 'rho');
    const xiTicks = Latex.ticks(beforeTicks, 'xi');
    const variable = derive(Queue.pop(), execute, ticks); 
    const exp = derive(Queue.pop(), execute, ticks);
    const env = findVarInfo(variable.name).env;
    if (execute) {
        if (env == "xi") {
            const scope = `${variable.name} \\notin dom \\rho${rhoTicks} \\and ${variable.name} \\in dom \\xi${xiTicks}`;
            const conditions = scope + `\\and ${exp.derivation}`;
            const mapping = {index : 0, map :  `\\{${variable.name} \\mapsto ${exp.value}\\}`};
            derivation = Latex.SetLatex('GlobalAssign', conditions, exp, variable, mapping, beforeTicks, ticks);
        } else {
            const scope = `${variable.name} \\in dom \\rho${rhoTicks}`;
            const conditions = scope + `\\and ${exp.derivation}`;
            const mapping = {index : 1, map : `\\{${variable.name} \\mapsto ${exp.value}\\}`};
            derivation = Latex.SetLatex('FormalAssign', conditions, exp, variable, mapping, beforeTicks, ticks);
        }
        let environment = {"rho" : rho, "xi" : xi};
        environment[env][variable.name] = exp.value;
        ticks[`${env}_ticks`]++;
    }
    return {"syntax" : `Set(${variable.syntax}, ${exp.syntax})`,
            "value" : exp.value,
            "derivation" : derivation,
            "impcore" : ['set'].concat(variable.impcore).concat(exp.impcore)};
}

function BEGIN(exp, execute, ticks) {

    const n_amnt = parseInt(exp.split("$begin")[1]);
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    let value = 0;
    let exps_syntax = "";
    let derivation, expression;
    let exps_derivations = "";
    let impcore = [exp];
    for (let i = 0; i < n_amnt; i++) {
        expression = derive(Queue.pop(), execute, ticks);
        exps_syntax += expression.syntax + ", ";
        exps_derivations += "  \\\\\\\\ " + expression.derivation;
        impcore = impcore.concat(expression.impcore);
    }
    exps_syntax = exps_syntax.substring(0, exps_syntax.length - 2);
    const syntax = `Begin(${exps_syntax})`;

    if (execute) {
        if (n_amnt == 0) {
            derivation = Latex.BeginLatex('EmptyBegin', " \\ ", syntax, 0, beforeTicks, ticks);
        }
        else {
            value = expression.value;
            derivation = Latex.BeginLatex('Begin', exps_derivations, syntax, value, beforeTicks, ticks);
        }
    }

    return {"syntax" : syntax,
            "value" : value,
            "derivation" : derivation,
            "impcore" : impcore};
}

function PRIMITIVE(exp, execute, ticks, functionInfo) {
    let derivation;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    const first = derive(Queue.pop(), execute, ticks);
    const second = derive(Queue.pop(), execute, ticks);
    const result = functionInfo.equation(first.value, second.value);
    const syntax = `Apply(${exp}, ${first.syntax}, ${second.syntax})`;
    let eqString = functionInfo.eqString.replace('$v_1', first.value).replace("$v_2", second.value);
    if (execute) {
        if (exp == "=") {
            if (result == 0) {
                eqString = eqString.replace('?=', '\\neq');
                derivation = Latex.ApplyLatex('ApplyEqFalse', exp, first, second, 
                                                eqString, syntax, result, beforeTicks, ticks);
                
            } else {
                eqString = eqString.replace('?=', '=');
                derivation = Latex.ApplyLatex('ApplyEqTrue', exp, first, second, 
                                                eqString, syntax, result, beforeTicks, ticks);
            }
        } else {
            derivation = Latex.ApplyLatex(`Apply${functionInfo.name}`, exp, first, second,
                                            eqString, syntax, result, beforeTicks, ticks);
        }
    }
    return {"syntax" : syntax,
            "value" : result,
            "derivation" : derivation,
            'impcore' : [exp].concat(first.impcore).concat(second.impcore)};
}



function _WHILE(execute, ticks, first) {
    let derivation, expression;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    let condition = derive(Queue.pop(), execute, ticks);
    const beforeQueue = Queue;
    if (execute) {
        expression = derive(Queue.pop(), condition.value != 0, ticks);
        if (condition.value == 0) {
            derivation = Latex.WhileLatex(`WhileEnd`, "", condition, expression, 
                                            `${condition.value} = 0`, beforeTicks, ticks);
        } 
        else {
            Queue = condition.impcore.concat(expression.impcore).reverse();
            if (first) {
                derivation = Latex.WhileLatex(`WhileIterate`, _WHILE(execute, ticks, false).derivation, 
                                            condition, expression, `${condition.value} \\neq 0`, beforeTicks, ticks);
            } else {
                const afterTicks = JSON.parse(JSON.stringify(ticks));
                derivation = Latex.WhileLatex(`WhileIterate`, _WHILE(execute, ticks, false).derivation, 
                                            condition, expression, `${condition.value} \\neq 0`, beforeTicks, afterTicks);
            }
        }
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