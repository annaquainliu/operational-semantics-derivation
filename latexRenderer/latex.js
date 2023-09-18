import {Syntax, translateEnvIntoWords, EnvChanges} from "../utilities/environment.js"

const syntax = new Syntax("\\{", "\\}", "\\xi", "\\rho", "\\phi", "\\mapsto", "_{", "}", "\\langle", "\\rangle");

/**
 * 
 * @param {String} name : Name of inference rule
 * @param {String} condition : Conditions of the inference rule
 * @param {String} exp_syntax : Abstract syntax of expression 
 * @param {String} result : The return value 
 * @param {EnvChanges} envs : Environment state
 * @returns {String} : Inference rule derivation in Latex code.
 * 
 * xi or phi cannot change
 */
function baseInferenceRule(name, condition, exp_syntax, result, envs) {
    const xi = envNotation("xi", envs.xi);
    const phi = envNotation("phi", envs.phi);
    const rho1 = envNotation("rho", envs.rho_1);
    const rho2 = envNotation("rho", envs.rho_2);
    return  `\\inferrule*[Right=\\textsc{${name}}]{${condition}}{\\state{\\textsc{${exp_syntax}}}{${xi}}{${phi}}{${rho1}} \\Downarrow \\state{\\textsc{${result}}}{${xi}}{${xi}}{${rho2}}}`;
}

/**
 * 
 * @param {Int} number 
 * @param {EnvChanges} envs 
 * @returns nothing
 */
function LiteralLatex(number, envs) {
    return baseInferenceRule('Literal', " \\ ", `Literal(${number})`, number, envs);
}

/**
 * 
 * @param {String} title 
 * @param {String} name 
 * @param {String} env 
 * @param {Int} result 
 * @param {EnvChanges} envs 
 * @returns 
 */
function VarLatex(title, name, env, result, envs) {
   let scope = getVarScope(name, env)
   return baseInferenceRule(title, scope, `Var(${name})`, result, envs);
}

function getVarScope(name, env) {
    if (env == "rho") {
        return`${name} \\in dom \\rho`
    } else {
        return `${name} \\notin dom \\rho \\and ${name} \\in dom \\xi`
    }
}

function IfLatex(title, syntax, cond_derivation, condition, branch_derivation, result, envs) {
    return baseInferenceRule(title, `${cond_derivation} \\and ${condition} \\and ${branch_derivation}`,
                            syntax, result, envs);
}

function SetLatex(title, exp, variable, envs, env) {
    let scope = getVarScope(variable.name, env)
    let conditions = scope + " \\and " + exp.derivation;
    return baseInferenceRule(title, conditions, `Set(${variable.name}, ${exp.syntax})`, exp.value, envs);
}

function BeginLatex(title, derivations, exps_syntax, result, envs) {
    return baseInferenceRule(title, derivations, `Begin(${exps_syntax})`, result, envs);
}

function WhileLatex(title, next_while, condition, exp, eqCondition, envs) {
    if (exp.derivation == null) {
        exp.derivation = "";
    }
    return baseInferenceRule(title, `${next_while} \\\\\\\\ ${condition.derivation} \\and ${eqCondition} \\and ${exp.derivation}`, `While(${condition.syntax}, ${exp.syntax})`,
                            0,
                            envs);
}

function ApplyLatex(title, functionName, exp_1, exp_2, eqString, result, envs) {
    return baseInferenceRule(title, `${eqString} \\\\\\\\ ${exp_2.derivation} \\\\\\\\ ${exp_1.derivation} \\\\\\\\ \\phi(${functionName}) = \\textsc{Primitive}(${functionName})`,
                            `Apply(${functionName}, ${exp_1.syntax}, ${exp_2.syntax})`,
                            result,
                            envs);
}

function envNotation(env, obj) {
    return translateEnvIntoWords(env, obj, syntax);
}

/**
 * @param {String} funcName 
 * @param {String} syntax 
 * @param {Array of String} params 
 * @param {JSON} exp 
 * @param {Array of JSON} params_der 
 * @param {Number} result 
 * @param {JSON} ticks_1 
 * @param {JSON} ticks_2 
 * @returns {String} 
 */
function ApplyUserLatex(funcName, syntax, paramNames, exp, paramsInfo, envs) {
    const paramsString = paramNames.toString();
    let paramsDerivations = "";
    let mapping = " \\{";
    for (let i = 0; i < paramsInfo.length; i++) {
        paramsDerivations = `\\\\\\\\ ${paramsInfo[i].derivation}` + paramsDerivations;
        mapping += ` ${paramsInfo[i].name} \\mapsto ${paramsInfo[i].value},`;
    }
    mapping = mapping.substring(0, mapping.length - 1) + "\\}";
    return baseInferenceRule('ApplyUser',
                            `${exp.derivation}  \\\\\\\\  \\rho = ${mapping} ${paramsDerivations} \\\\\\\\ ${paramsString} \\text{ all distinct} \\\\\\\\ \\phi(\\textsc{${funcName}}) = \\textsc{User}(\\langle \\textsc{${paramsString}} \\rangle, \\textsc{${exp.syntax}})`,
                            syntax,
                            exp.value,
                            envs);
}

export default {LiteralLatex, 
                VarLatex, 
                IfLatex, 
                SetLatex, 
                BeginLatex, 
                WhileLatex, 
                ApplyLatex, 
                ApplyUserLatex,
                envNotation};