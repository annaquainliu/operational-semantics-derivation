const input = document.getElementById('input');
const latexButton  = document.getElementById('deriveLatex');
const HtmlButton = document.getElementById('deriveHTML');
const latexOutput = document.getElementById("latex");
const HtmlOutput = document.getElementById('HTMLOutput');
const variables = document.getElementsByClassName('variable');
const screenHeight = screen.height;
const screenWidth = screen.width;
import HtmlElement from './htmlRenderer/htmlElement.js';
import Latex from './latexRenderer/latex.js';
import Rules from './htmlRenderer/inferenceRules.js';

HtmlOutput.style.fontSize = HtmlElement.fontSize;

let xi = {};
let rho = {};

let startingFormat, endingFormat;
let Queue = [];
const numberDerivationsCap = 50;
let numberDerivations = 0;
let ticks = {rho_ticks : 0, xi_ticks : 0};

window.onload = () => {
    document.getElementById("output").style.display = 'none';
    HtmlOutput.style.display = 'none';
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
    ticks = {rho_ticks : 0, xi_ticks : 0};
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
[HtmlButton, latexButton].forEach(button => {button.addEventListener('click', () => {
    numberDerivations = 0;
    let value = input.value.toLowerCase();
    if (value == "" || value == null) {
        alert("Ill-formed Impcore expression");
        return;
    }
    addVariablesToEnv(); //add variables
    addValuesToQueue(value); //add values to queue
    HtmlOutput.style.scale = '1'; //reset html output scale to 1
    const renderHTML = button.getAttribute('id') == 'deriveHTML';
    try {
        const derivation = derive(Queue.pop(), true, renderHTML);
        if (renderHTML) {
            HtmlOutput.innerHTML = derivation.derivation.html;
            window.location.href = "#HTMLOutput";
            HtmlOutput.style.display = 'flex';
        } else {
            latexOutput.innerText = startingFormat + derivation.derivation + endingFormat;
            window.location.href = "#output";
            document.getElementById("output").style.display = 'block';
        }
    } catch ({name, message}) {
        console.log(message);
        if (message == "Nested derivation is too deep.") {
            alert(`The derivation has over the max amount of layers (${numberDerivationsCap}).`);
        } else {
            alert(`Improper Impcore expression!`);
        }
        return;
    }
})});

function addValuesToQueue(value) {
    Queue = [];
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
function derive(exp, execute, html) {

    numberDerivations++;
    if (numberDerivations > numberDerivationsCap) {
        throw new Error("Nested derivation is too deep.");
    }
    if (!isNaN(exp)) {
        return LIT(parseInt(exp), execute, html);
    }
    if (exp.startsWith("$begin")) {
        return BEGIN(exp, execute, html);
    }
    switch (exp) {
        case "if":
            return IF(execute, html);
        case "set":
            return SET(execute, html);
        case "while":
            return _WHILE(execute, html);
        case "&&":
            return PRIMITIVE("\\&\\&", execute, html, {name : "And",
                                                   equation : (f, s) => f && s ? 1 : 0,
                                                   eqString : "$v_1 \\textsc{ \\&\\& } $v_2 = $v_r"});
        case "||":
            return PRIMITIVE(exp, execute, html, {name : "Or",
                                                   equation : (f, s) => f || s ? 1 : 0,
                                                   eqString : "$v_1 \\textsc{ || } $v_2 = $v_r"});
        case "mod":
            return PRIMITIVE(exp, execute, html, {name : 'Mod',
                                                   equation: (f, s) => f % s,
                                                   eqString : "-2^{31} \\leq $v_1 \\textsc{ mod } $v_2 < 2^{31}"})
        case "+":
            return PRIMITIVE(exp, execute, html, {name : 'Add', 
                                                   equation : (f, s) => f + s, 
                                                   eqString : "-2^{31} \\leq $v_1 + $v_2 < 2^{31}"});
        case "-":
            return PRIMITIVE(exp, execute, html, {name : 'Sub', 
                                                   equation : (f, s) => f - s,
                                                   eqString : "-2^{31} \\leq $v_1 - $v_2 < 2^{31}"});
        case "/":
            return PRIMITIVE(exp, execute, html, {name : 'Div', 
                                                   equation : (f, s) => Math.floor(f / s),
                                                   eqString : "-2^{31} \\leq $v_1 / $v_2 < 2^{31}"});
        case "*":
            return PRIMITIVE(exp, execute, html, {name : 'Mult', 
                                                   equation : (f, s) => f * s,
                                                   eqString : "-2^{31} \\leq $v_1 * $v_2 < 2^{31}"});
        case "=":
            return PRIMITIVE(exp, execute, html, {name : 'Eq', 
                                                   equation : (f, s) => f == s ? 1 : 0,
                                                   eqString : "$v_1 ?= $v_2"});
        case ">":
            return PRIMITIVE(exp, execute, html, {name : 'Gt', 
                                                   equation : (f, s) => f > s ? 1 : 0,
                                                   eqString : "$v_1 > $v_2 = $v_r"});
        case "<":
            return PRIMITIVE(exp, execute, html, {name : 'Lt', 
                                                    equation : (f, s) => f < s ? 1 : 0,
                                                    eqString : "$v_1 < $v_2 = $v_r"});
        default:
           return VAR(exp, execute, html);
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

function LIT(number, execute, html) {
    let derivation;
    if (execute) {
        if (html) {
            const unchangedEnvs = Rules.State.bothEnvInfo(ticks, null, null);
            derivation = new Rules.Literal(number, unchangedEnvs, unchangedEnvs);
        } else {
            derivation = Latex.LiteralLatex(number, ticks);
        }
    }
    return {"syntax" : `Literal(${number})`, 
            "value" : number,
            "derivation" : derivation,
            "impcore" : [number]};
}

function VAR(name, execute, html) {
    let variable = findVarInfo(name);
    let derivation;
    const rhoTicks = Latex.ticks(ticks, 'rho');
    const xiTicks = Latex.ticks(ticks, 'xi');
    if (execute) {
        const envInfo = Rules.State.bothEnvInfo(ticks, null, null);
        if (variable.env == "rho") {
            derivation = html ? new Rules.Var('FormalVar', variable.env, name, envInfo, envInfo) 
                              : Latex.VarLatex('FormalVar', name, `${name} \\in dom \\rho${rhoTicks}`, 
                                                `$\\rho${rhoTicks}(${name})$`, ticks);
        } 
        else {
            derivation = html ? new Rules.Var('GlobalVar', variable.env, name, envInfo, envInfo)
                              : Latex.VarLatex('GlobalVar', name, 
                                        `${name} \\notin dom \\rho${rhoTicks} \\and ${name} \\in dom \\xi${xiTicks}`,
                                        `$\\xi${xiTicks}(${name})$`, ticks);
        }
    }
    return {"syntax" : `Var(${name})`, 
            "value" : variable.value, 
            "derivation" : derivation,
            "name" : name,
            "impcore" : [name]};
}

function IF(execute, html) {
    let derivation, value;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    const condition = derive(Queue.pop(), execute, html);
    const trueCase = derive(Queue.pop(), condition.value != 0 && execute, html);
    const falseCase = derive(Queue.pop(), condition.value == 0 && execute, html);
    const syntax = `If(${condition.syntax}, ${trueCase.syntax}, ${falseCase.syntax})`;
     //ticks obj is changed by reference
    if (execute) {
        const beforeEnv = Rules.State.bothEnvInfo(beforeTicks, null, null);
        const afterEnv = Rules.State.bothEnvInfo(ticks, null, null);
        if (condition.value == 0) {
            value = falseCase.value;
            derivation = html ? new Rules.If('IfFalse', syntax, value, condition.derivation, 
                                condition.value, falseCase.derivation, beforeEnv, afterEnv)
                              : Latex.IfLatex("IfFalse", syntax, condition.derivation, 
                                        `${condition.value} = 0`, falseCase.derivation, 
                                        value, beforeTicks, ticks);
        } else {
            value = trueCase.value;
            derivation = html ? new Rules.If('IfTrue', syntax, value, condition.derivation,
                                condition.value, trueCase.derivation, beforeEnv, afterEnv)
                              : Latex.IfLatex("IfTrue", syntax, condition.derivation, 
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

function SET(execute, html) {
    let derivation;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    const rhoTicks = Latex.ticks(beforeTicks, 'rho');
    const xiTicks = Latex.ticks(beforeTicks, 'xi');
    const variable = derive(Queue.pop(), execute, html); 
    const exp = derive(Queue.pop(), execute, html);
    const env = findVarInfo(variable.name).env;
    const syntax = `Set(${variable.syntax}, ${exp.syntax})`;
    if (execute) {
        let conditions, latexMap, title, afterEnv;
        const beforeEnv = Rules.State.bothEnvInfo(beforeTicks, null, null);
        if (env == "xi") {
            const scope = `${variable.name} \\notin dom \\rho${rhoTicks} \\and ${variable.name} \\in dom \\xi${xiTicks}`;
            conditions = scope + `\\and ${exp.derivation}`;
            latexMap = {index : 0, map :  `\\{${variable.name} \\mapsto ${exp.value}\\}`};
            title = 'GlobalAssign';
            afterEnv = Rules.State.bothEnvInfo(ticks, null, {name: variable.name, value: exp.value});
        } else {
            const scope = `${variable.name} \\in dom \\rho${rhoTicks}`;
            conditions = scope + `\\and ${exp.derivation}`;
            latexMap = {index : 1, map : `\\{${variable.name} \\mapsto ${exp.value}\\}`};
            title = 'FormalAssign';
            afterEnv = Rules.State.bothEnvInfo(ticks, {name: variable.name, value: exp.value}, null);
        }
        derivation = html ? new Rules.Set(title, syntax, env, variable.name, exp.derivation, beforeEnv, afterEnv)
                          : Latex.SetLatex(title, conditions, exp, variable, latexMap, beforeTicks, ticks);
        let environment = {"rho" : rho, "xi" : xi};
        environment[env][variable.name] = exp.value;
        ticks[`${env}_ticks`]++;
    }
    return {"syntax" : syntax,
            "value" : exp.value,
            "derivation" : derivation,
            "impcore" : ['set'].concat(variable.impcore).concat(exp.impcore)};
}



function BEGIN(exp, execute, html) {
    const n_amnt = parseInt(exp.split("$begin")[1]);
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    let value = 0;
    let exps_syntax = "";
    let derivation, expression;
    let exps_derivations = html ? [] : "";
    let impcore = [exp];
    for (let i = 0; i < n_amnt; i++) {
        expression = derive(Queue.pop(), execute, html);
        exps_syntax += expression.syntax + ", ";
        html ? exps_derivations.push(expression.derivation) : 
               exps_derivations += "  \\\\\\\\ " + expression.derivation;
        impcore = impcore.concat(expression.impcore);
    }
    exps_syntax = exps_syntax.substring(0, exps_syntax.length - 2);
    const syntax = exps_syntax;
    if (execute) {
        const beforeEnv = Rules.State.bothEnvInfo(beforeTicks, null, null);
        const afterEnv =  Rules.State.bothEnvInfo(ticks, null, null);
        if (n_amnt == 0) {
            derivation = html ? new Rules.Begin('EmptyBegin', syntax, 0, exps_derivations, beforeEnv, afterEnv)
                              : Latex.BeginLatex('EmptyBegin', " \\ ", syntax, 0, beforeTicks, ticks);
        }
        else {
            value = expression.value;
            derivation = html ? new Rules.Begin('Begin', syntax, value, exps_derivations, beforeEnv, afterEnv)
                              : Latex.BeginLatex('Begin', exps_derivations, syntax, value, beforeTicks, ticks);
        }
    }
    return {"syntax" : syntax, 
            "value" : value, 
            "derivation" : derivation, 
            "impcore" : impcore};
}

function PRIMITIVE(exp, execute, html, functionInfo) {
    let derivation;
    let title = `Apply${functionInfo.name}`;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    const first = derive(Queue.pop(), execute, html);
    const second = derive(Queue.pop(), execute, html);
    const result = functionInfo.equation(first.value, second.value);
    const syntax = `Apply(${exp}, ${first.syntax}, ${second.syntax})`;
    let eqString = functionInfo.eqString.replace('$v_1', first.value).replace("$v_2", second.value);
    if (execute) {
        if (exp == "=") {
            if (result == 0) {
                eqString = eqString.replace('?=', '\\neq');
                title = 'ApplyEqFalse';
                
            } else {
                eqString = eqString.replace('?=', '=');
                title = 'ApplyEqTrue';
            }
        }
        const beforeEnv = Rules.State.bothEnvInfo(beforeTicks, null, null);
        const afterEnv = Rules.State.bothEnvInfo(ticks, null, null);
        derivation = html ? new Rules.Apply(title, syntax, result, 
                            Rules.Apply.makeCondInfo(exp, eqString, first.derivation, second.derivation),
                            beforeEnv, afterEnv)
                          : Latex.ApplyLatex(title, exp, first, second,
                                             eqString, syntax, result, beforeTicks, ticks);
    }
    return {"syntax" : syntax,
            "value" : result,
            "derivation" : derivation,
            'impcore' : [exp].concat(first.impcore).concat(second.impcore)};
}

function _WHILE(execute, html) {
    let derivation;
    const beforeTicks = JSON.parse(JSON.stringify(ticks));
    const cond = derive(Queue.pop(), execute, html);
    const exp = derive(Queue.pop(), cond.value != 0 && execute, html);
    const syntax = `While(${cond.syntax}, ${exp.syntax})`;
    const beforeQueue = Queue;
    if (execute) {
        derivation = html ? whileHTML(cond, exp, syntax, beforeTicks)
                          : whileLatex(cond, exp, beforeTicks);
    } 
    Queue = beforeQueue;
    return {"syntax" : syntax,
            "value" : 0,
            "derivation": derivation,
            "impcore" : ['while'].concat(cond.impcore).concat(exp.impcore)};
}

function whileHTML(cond, exp, syntax, beforeTicks) {
    const beforeEnv = Rules.State.bothEnvInfo(beforeTicks, null, null);
    if (cond.value == 0) {
        const afterEnv = Rules.State.bothEnvInfo(ticks, null, null);
        return new Rules.While(`WhileEnd`, syntax, "", cond.derivation, 
                                    exp.derivation, beforeEnv, afterEnv);
    } else {
        Queue = cond.impcore.concat(exp.impcore).reverse();
        const nextWhile = _WHILE(true, true).derivation;
        const afterEnv = Rules.State.bothEnvInfo(ticks, null, null);
        return new Rules.While('WhileIterate', syntax, nextWhile, 
                                cond.derivation, exp.derivation, beforeEnv, afterEnv);
    }
}

function whileLatex(cond, exp, beforeTicks) {
    if (cond.value == 0) {
        return Latex.WhileLatex('WhileEnd', "", cond, exp, 
                                `${cond.value} = 0`, beforeTicks, ticks);
    } else {
        Queue = cond.impcore.concat(exp.impcore).reverse();
        return Latex.WhileLatex(`WhileIterate`, _WHILE(true, false).derivation, 
                                cond, exp, `${cond.value} \\neq 0`, beforeTicks, ticks);
    }
}