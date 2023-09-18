const input = document.getElementById('input');
const latexButton  = document.getElementById('deriveLatex');
const HtmlButton = document.getElementById('deriveHTML');
const latexOutput = document.getElementById("latex");
const HtmlOutput = document.getElementById('HTMLOutput');
import HtmlElement from './htmlRenderer/htmlElement.js';
import Latex from './latexRenderer/latex.js';
import Rules from './htmlRenderer/inferenceRules.js';
import {EnvChanges} from './utilities/environment.js'

HtmlOutput.style.fontSize = HtmlElement.fontSize;

/* Initialize Globals */
let xi = {};
let rho = {};
let phi = {};

let html; //global var that is true if user wants html render, false otherwise
let startingFormat, endingFormat; //the formatting for latex
let Queue = [];
const numberDerivationsCap = 100; // max amount of recursive derivations
let numberDerivations = 0; //the amount of derivations
/* End Globals */

window.onload = () => {
    document.getElementById("output").style.display = 'none';
    document.getElementById('HTMLOuter').style.display = 'none';
    fetch('format.json')
        .then(response => response.json())
        .then(result => {
            startingFormat = result.startingFormat;
            endingFormat = result.endingFormat;
    });
}

function addVariablesToEnv() {
    numberDerivations = 0;
    xi = {}; rho = {}; phi = {};// clear environments
    const xiLambda = mapping => {
        const fields = mapping.innerText.replaceAll(" ", "").split('→');
        if (fields.length != 2) {
            return;
        }
        const name = fields[0].toLowerCase();
        const value = fields[1];
        xi[name] = parseInt(value);
    };
    const phiLambda = mapping => {
        const fields = mapping.innerText.toLowerCase().replaceAll(" ", "").split('→');
        const name = fields[0];
        let params;
        if (fields[1] == "()") {
            params = [];
        } else {
            params = fields[1].substring(1, fields[1].length - 1).split(",");
            params = params.filter((v, i, a) => v != "" && v != null);
        }
        const expressionStr = mapping.getElementsByTagName('input')[0].value.toLowerCase();
        const impcore = addValuesToQueue(expressionStr);
        phi[name] = {'exp' : impcore, 'parameters' : params};
    }
    addSpecificEnv('phi', phiLambda);
    addSpecificEnv('xi', xiLambda);
}

function addSpecificEnv(env, lambda) {
    const variables = document.getElementById(env).getElementsByClassName('varAndvalue');
    Array.prototype.forEach.call(variables, lambda);
}
//derive
[HtmlButton, latexButton].forEach(button => {button.addEventListener('click', () => {
    let value = input.value.toLowerCase();
    if (value == "" || value == null) {
        alert("Ill-formed Impcore expression");
        return;
    }
    EnvChanges.reset();
    addVariablesToEnv(); //add variables
    Queue = addValuesToQueue(value); //add values to queue
    HtmlOutput.style.scale = '1'; //reset html output scale to 1
    html = button.getAttribute('id') == 'deriveHTML';
    try {
        const derivation = derive(Queue.pop(), true);
        if (html) {
            HtmlOutput.innerHTML = derivation.derivation.html;
            window.location.href = "#HTMLOutput";
            document.getElementById('HTMLOuter').style.display = 'flex';
        } else {
            latexOutput.innerText = startingFormat + derivation.derivation + endingFormat;
            window.location.href = "#output";
            document.getElementById("output").style.display = 'block';
        }
    } catch ({name, message}) {
        console.log(message)
        if (message == "Nested derivation is too deep.") {
            alert(`The derivation has over the max amount of layers (${numberDerivationsCap}).`);
        } else {
            alert(`Improper Impcore expression!`);
        }
        return;
    }
})});

/**
 * 
 * Takes in the expression to derive and returns a queue where
 * each item pushed on the queue is a non empty string seperated
 * by a " " or "(" or ")". It uses a recursive helper function,
 * queueHelper().
 * 
 * The one exception is the command "begin", as the "begin" keyword
 * is pushed onto the queue as "$" + "begin" + <Number of Exps in the Begin>.
 * The "$" is so this exp is not mixed up as a user defined variable,
 * since variables/functions cannot start with "$". The number of expressions
 * is to indicate how many times the queue should be popped off when it 
 * reaches the begin.
 * 
 * Examples:
 *  "(if (set x 0) x 0)" returns [0, x, 0, x, set, if].
 *  "(begin (begin 4 5) 5 (begin x) d)" returns [d, x, $begin1, 5, 5, 4, $begin2, $begin4]
 * 
 * @param {String} value : The entire string exp
 * @returns {Array} : The queue that holds all of the expressions
 * 
 */
function addValuesToQueue(value) {
    let queue = [];
    let index = 0;
    let beginIndexes = [];
    queueHelper(value, "", null);
    queue.reverse();
    return queue;
    /**
     * 
     * @param {String} input 
     * @param {String} string 
     * @param {*} beginAmount 
     * @returns 
     */
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
                    beginIndexes.push(queue.length);
                    beginAmount = 0;
                }
                else if (beginAmount != null && string != "") {
                    beginAmount++;
                }
                if (string != "") {
                    queue.push(string);
                    string = "";
                }
                if (beginAmount != null && char == ")") {
                    queue[beginIndexes.pop()] = `$begin${beginAmount.toString()}`;
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
            queue.push(string);
        }
    }
}
// ticks carry the ticks from before
function derive(exp, execute) {
    numberDerivations++;
    if (numberDerivations > numberDerivationsCap) {
        throw new Error("Nested derivation is too deep.");
    }
    if (!isNaN(exp)) {
        return LIT(parseInt(exp), execute);
    }
    if (exp.startsWith("$begin")) {
        return BEGIN(exp, execute);
    }
    if (phi[exp] != null) { //if exp is a user-defined function
        return APPLY(exp, execute);
    }
    switch (exp) {
        case "if":
            return IF(execute);
        case "set":
            return SET(execute);
        case "while":
            return _WHILE(execute);
        case "&&":
            return PRIMITIVE(exp, execute, {name : "And",
                                                   equation : (f, s) => f && s ? 1 : 0,
                                                   eqString : "$v_1 \\textsc{ \\&\\& } $v_2 = $v_r"});
        case "||":
            return PRIMITIVE(exp, execute, {name : "Or",
                                                   equation : (f, s) => f || s ? 1 : 0,
                                                   eqString : "$v_1 \\textsc{ || } $v_2 = $v_r"});
        case "mod":
            return PRIMITIVE(exp, execute, {name : 'Mod',
                                                   equation: (f, s) => f % s,
                                                   eqString : "-2^{31} \\leq $v_1 \\textsc{ mod } $v_2 < 2^{31}"})
        case "+":
            return PRIMITIVE(exp, execute, {name : 'Add', 
                                                   equation : (f, s) => f + s, 
                                                   eqString : "-2^{31} \\leq $v_1 + $v_2 < 2^{31}"});
        case "-":
            return PRIMITIVE(exp, execute, {name : 'Sub', 
                                                   equation : (f, s) => f - s,
                                                   eqString : "-2^{31} \\leq $v_1 - $v_2 < 2^{31}"});
        case "/":
            return PRIMITIVE(exp, execute, {name : 'Div', 
                                                   equation : (f, s) => Math.floor(f / s),
                                                   eqString : "-2^{31} \\leq $v_1 / $v_2 < 2^{31}"});
        case "*":
            return PRIMITIVE(exp, execute, {name : 'Mult', 
                                                   equation : (f, s) => f * s,
                                                   eqString : "-2^{31} \\leq $v_1 * $v_2 < 2^{31}"});
        case "=":
            return PRIMITIVE(exp, execute, {name : 'Eq', 
                                                   equation : (f, s) => f == s ? 1 : 0,
                                                   eqString : "$v_1 ?= $v_2"});
        case ">":
            return PRIMITIVE(exp, execute, {name : 'Gt', 
                                                   equation : (f, s) => f > s ? 1 : 0,
                                                   eqString : "$v_1 > $v_2 = $v_r"});
        case "<":
            return PRIMITIVE(exp, execute, {name : 'Lt', 
                                                    equation : (f, s) => f < s ? 1 : 0,
                                                    eqString : "$v_1 < $v_2 = $v_r"});
        default:
           return VAR(exp, execute);
    }
}

/////////////////////////
/* START OF UTILITIES */
/////////////////////////

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

/////////////////////////
/* END OF UTILITIES */
/////////////////////////

function LIT(number, execute) {
    let derivation;
    let envs = EnvChanges.saveState(html);
    if (execute) {
        if (html) {
            derivation = new Rules.Literal(number, envs);
        } else {
            derivation = Latex.LiteralLatex(number, envs);
        }
    }
    return {"syntax" : `Literal(${number})`, 
            "value" : number,
            "derivation" : derivation,
            "impcore" : [number]};
}

function VAR(name, execute) {
    let variable = findVarInfo(name);
    let derivation
    if (execute) {
        let title = "";
        if (variable.env == "rho") {
            title = "FormalVar"
        } 
        else {
           title = "GlobalVar"
        }
        let envs = EnvChanges.saveState(html);
        derivation = html ? new Rules.Var(title, variable.env, name, variable.value, envs) 
                            : Latex.VarLatex(title, name, variable.env, `${variable.value}`, envs);
    }
    return {"syntax" : `Var(${name})`, 
            "value" : variable.value, 
            "derivation" : derivation,
            "name" : name,
            "impcore" : [name]};
}

function IF(execute) {
    let derivation, title, branch;
    const initial = EnvChanges.saveState(html);
    const condition = derive(Queue.pop(), execute);
    const trueCase = derive(Queue.pop(), condition.value != 0 && execute);
    const falseCase = derive(Queue.pop(), condition.value == 0 && execute);
    const syntax = `If(${condition.syntax}, ${trueCase.syntax}, ${falseCase.syntax})`;

    if (condition.value == 0) {
        branch = falseCase;
        title = "IfFalse";
    } else {
        branch = trueCase;
        title = "IfTrue";
    }
     //ticks obj is changed by reference
    if (execute) {
        let final = EnvChanges.saveState(html)
        derivation = html ? ifHTML(title, syntax, condition, branch, initial, final)
                          : ifLatex(title, condition, syntax, branch, initial, final);
    }
    let impcore = ['if'].concat(condition.impcore).concat(trueCase.impcore).concat(falseCase.impcore);
    return {"syntax" : syntax, 
            "value" : branch.value, 
            "derivation" : derivation,
            "impcore" : impcore};
}

function ifLatex(title, condition, syntax, branch, initial, final) {
    let stringCondition;
    if (condition.value == 0) {
        stringCondition = `0 = 0`;
    } else {
        stringCondition = `${condition.value} \\neq 0`;
    }

    return Latex.IfLatex(title, syntax, condition.derivation, 
        stringCondition, branch.derivation, 
        branch.value, initial, final);
}

function ifHTML(title, syntax, condition, branch, initial, final) {
    return new Rules.If(title, syntax, branch.value, condition.derivation, 
                condition.value, branch.derivation, initial, final);
}

function SET(execute) {
    let derivation;
    const initial = EnvChanges.saveState(html);
    const variable = derive(Queue.pop(), execute); 
    const exp = derive(Queue.pop(), execute);
    const env = findVarInfo(variable.name).env;
    const syntax = `Set(${variable.name}, ${exp.syntax})`;

    if (execute) {
        let environment = {"rho" : rho, "xi" : xi};
        environment[env][variable.name] = exp.value;
        EnvChanges.addMapToEnv(env, variable.name, exp.value, html)
        let final = EnvChanges.saveState(html);
        let title = env == "xi" ? 'GlobalAssign' : 'FormalAssign';
        derivation = html ? setHTML(env, title, syntax, variable, exp, initial, final)
                          : setLatex(env, title, exp, variable, initial, final)
    }
    return {"syntax" : syntax,
            "value" : exp.value,
            "derivation" : derivation,
            "impcore" : ['set'].concat(variable.impcore).concat(exp.impcore)};
}

function setLatex(env, title, exp, variable, initial, final) {
    return Latex.SetLatex(title, exp, variable, env, initial, final);
}

function setHTML(env, title, syntax, variable, exp, initial, final) {
    return new Rules.Set(title, syntax, env, variable.name, exp.derivation, initial, final);
}

function BEGIN(exp, execute) {
    const n_amnt = parseInt(exp.split("$begin")[1]);
    let value = 0;
    let exps_syntax = "";
    let initial = EnvChanges.saveState(html)
    let derivation, expression;
    let exps_derivations = html ? [] : "";
    let impcore = [exp];
    for (let i = 0; i < n_amnt; i++) {
        expression = derive(Queue.pop(), execute);
        exps_syntax += expression.syntax + ", ";
        html ? exps_derivations.push(expression.derivation) : 
               exps_derivations = "  \\\\\\\\ " + expression.derivation + exps_derivations;
        impcore = impcore.concat(expression.impcore);
    }
    exps_syntax = exps_syntax.substring(0, exps_syntax.length - 2);
    const syntax = exps_syntax;
    if (execute) {
        let final = EnvChanges.saveState(html);
        if (n_amnt == 0) {
            derivation = html ? new Rules.Begin('EmptyBegin', syntax, 0, exps_derivations, initial, final)
                              : Latex.BeginLatex('EmptyBegin', " \\ ", syntax, 0, initial, final);
        }
        else {
            value = expression.value;
            derivation = html ? new Rules.Begin('Begin', syntax, value, exps_derivations, initial, final)
                              : Latex.BeginLatex('Begin', exps_derivations, syntax, value, initial, final);
        }
    }
    return {"syntax" : `Begin(${syntax})`, 
            "value" : value, 
            "derivation" : derivation, 
            "impcore" : impcore};
}

function PRIMITIVE(exp, execute, functionInfo) {
    const symbol = exp == "&&" ? "\\&\\&" : exp;
    let derivation;
    let title = `Apply${functionInfo.name}`;
    const initial = EnvChanges.saveState(html);
    const first = derive(Queue.pop(), execute);
    const second = derive(Queue.pop(), execute);
    const result = functionInfo.equation(first.value, second.value);
    const syntax = `Apply(${html ? exp : symbol}, ${first.syntax}, ${second.syntax})`;
    let eqString = functionInfo.eqString.replace('$v_1', first.value)
                                        .replace("$v_2", second.value)
                                        .replace("$v_r", result);
    if (execute) {
        if (symbol == "=") {
            if (result == 0) {
                eqString = eqString.replace('?=', '\\neq');
                title = 'ApplyEqFalse';
                
            } else {
                eqString = eqString.replace('?=', '=');
                title = 'ApplyEqTrue';
            }
        }
        const final = EnvChanges.saveState(html);
        derivation = html ? new Rules.Apply(title, syntax, result, 
                            Rules.Apply.makeCondInfo(exp, first.derivation, second.derivation),
                            initial, final)
                          : Latex.ApplyLatex(title, symbol, first, second,
                                             eqString, result, initial, final);
    }
    return {"syntax" : syntax,
            "value" : result,
            "derivation" : derivation,
            'impcore' : [exp].concat(first.impcore).concat(second.impcore)};
}

function _WHILE(execute) {
    let derivation;
    const initial = EnvChanges.saveState(html)
    const cond = derive(Queue.pop(), execute);
    const exp = derive(Queue.pop(), cond.value != 0 && execute);
    const syntax = `While(${cond.syntax}, ${exp.syntax})`;
    const beforeQueue = Queue;
    let final = EnvChanges.saveState(html)
    if (execute) {
        let result = html ? whileHTML(cond, exp, syntax, initial, final)
                          : whileLatex(cond, exp, initial, final);
        derivation = result.derivation
        final = result.final
    } 
    Queue = beforeQueue;
    return {"syntax" : syntax,
            "value" : 0,
            "derivation": derivation,
            "impcore" : ['while'].concat(cond.impcore).concat(exp.impcore),
            "finalState" : final};
}

function whileHTML(cond, exp, syntax, initial, final) {
    
    if (cond.value == 0) {
        return {derivation : new Rules.While(`WhileEnd`, syntax, "", cond.derivation, exp.derivation, initial, final),
                final : final};
    } else {
        Queue = cond.impcore.concat(exp.impcore).reverse();
        const nextWhile = _WHILE(true, true);
        return {derivation : new Rules.While('WhileIterate', syntax, nextWhile.derivation, cond.derivation, exp.derivation, initial, nextWhile.finalState),
                final : nextWhile.finalState};
    }
}

function whileLatex(cond, exp, initial, final) {
    if (cond.value == 0) {
        return {derivation : Latex.WhileLatex('WhileEnd', "", cond, exp, `${cond.value} = 0`, initial, final),
                final : final};
    } else {
        Queue = cond.impcore.concat(exp.impcore).reverse();
        const nextWhile =  _WHILE(true)
        return {derivation : Latex.WhileLatex(`WhileIterate`, nextWhile.derivation, cond, exp, `${cond.value} \\neq 0`, initial, nextWhile.finalState),
                final : nextWhile.finalState};
    }
}

function APPLY(funName, execute) {
    let body, derivation;
    const funInfo = phi[funName];
    const params = funInfo.parameters;
    let paramsInfo = [];
    let params_syntax = "";
    let impcore = [funName];
    let value = 0;
    let newRho = {};
    const initial = EnvChanges.saveState(html);
    params.forEach(param => {
        const param_derivation = derive(Queue.pop(), execute);
        param_derivation.name = param;
        newRho[param] = param_derivation.value;
        paramsInfo.push(param_derivation);
        params_syntax += param_derivation.syntax + ", ";
        impcore = impcore.concat(param_derivation.impcore);
    });
    const final = EnvChanges.saveState(html);
    EnvChanges.beforeFunCall();
    const rho_2 = JSON.parse(JSON.stringify(rho))
    rho = newRho; //setting the new rho
    params_syntax = params_syntax.substring(0, params_syntax.length - 2);
    if (params_syntax != "") {
        params_syntax = ", " + params_syntax;
    }
    const syntax = `Apply(${funName}${params_syntax})`;
    if (execute) {
        Queue = Queue.concat(funInfo.exp);
        body = derive(Queue.pop(), true);
        value = body.value;
        derivation = applyUserDerivation(funName, syntax, params, body, paramsInfo, initial, final);
    }
    EnvChanges.afterFunCall(final)
    rho = rho_2; //resetting rho to after all the params were evaluated
    return { 'syntax' : syntax,
             'derivation' : derivation,
             'value' : value,
             'impcore' : impcore
            };
}

function applyUserDerivation(funName, syntax, params, body, paramsInfos, initial, final) {
    if (html) {
        return new Rules.ApplyUser(funName, syntax, params, paramsInfos, body, initial, final);
    } else {
        return Latex.ApplyUserLatex(funName, syntax, params, body, paramsInfos, initial, final);
    }
}