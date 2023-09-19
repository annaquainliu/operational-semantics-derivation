import { makeEqString } from "../utilities/symbols.js";
/**
 * 
 * @param {String} name : Name of inference rule
 * @param {String} condition : Conditions of the inference rule
 * @param {String} exp_syntax : Abstract syntax of expression 
 * @param {String} result : The return value 
 * @param {JSON} initialState : {String : String}
 * @param {JSON} finalState : {String : String}
 * @returns {String} : Inference rule derivation in Latex code.
 * 
 * xi or phi cannot change
 */
function baseInferenceRule(name, condition, exp_syntax, result, initial, final) {
    return  `\\inferrule*[Right=\\textsc{${name}}]{${condition}}{\\state{\\textsc{${exp_syntax}}}{\\xi${initial.xi}}{\\phi}{\\rho${initial.rho}} \\Downarrow \\state{\\textsc{${result}}}{\\xi${final.xi}}{\\phi}{\\rho${final.rho}}}`;
}

/**
 * 
 * @param {Int} number 
 * @returns nothing
 */
function LiteralLatex(number, state) {
    return baseInferenceRule('Literal', " \\ ", `Literal(${number})`, number, state, state);
}

/**
 * 
 * @param {String} title 
 * @param {String} name 
 * @param {String} env 
 * @param {Int} result 
 * @returns 
 */
function VarLatex(title, name, env, result, state) {
   let scope = getVarScope(name, env, state)
   return baseInferenceRule(title, scope, `Var(${name})`, result, state, state);
}

function getVarScope(name, env, state) {
    if (env == "rho") {
        return`${name} \\in dom(\\rho${state.rho})`
    } else {
        return `${name} \\notin dom(\\rho${state.rho}) \\and ${name} \\in dom(\\xi${state.xi})`
    }
}

function IfLatex(title, syntax, cond_derivation, condition, branch_derivation, result, initial, final) {

    return baseInferenceRule(title, `${cond_derivation} \\and ${condition} \\and ${branch_derivation}`,
                            syntax, result, initial, final);
}

function SetLatex(title, exp, variable, env, initial, final) {
    let scope = getVarScope(variable.name, env, initial)
    let conditions = scope + " \\and " + exp.derivation;
    return baseInferenceRule(title, conditions, `Set(${variable.name}, ${exp.syntax})`, exp.value, initial, final);
}

function BeginLatex(title, derivations, exps_syntax, result, initial, final) {
    return baseInferenceRule(title, derivations, `Begin(${exps_syntax})`, result, initial, final);
}

function WhileLatex(title, next_while, condition, exp, eqCondition, initial, final) {
    if (exp.derivation == null) {
        exp.derivation = "";
    }
    return baseInferenceRule(title, `${next_while} \\\\\\\\ ${condition.derivation} \\and ${eqCondition} \\and ${exp.derivation}`, `While(${condition.syntax}, ${exp.syntax})`,
                            0,
                            initial, final);
}

function ApplyLatex(title, functionName, exp_1, exp_2, result, initial, final) {
    let eqString = makeEqString(functionName, exp_1.value, exp_2.value, result,
        {leq: "\\leq", neq: "\\neq", start_sup: "^{", end_sup: "}"})

    return baseInferenceRule(title, `\\phi(${functionName}) = \\textsc{Primitive}(${functionName}) \\\\\\\\ ${exp_1.derivation} \\\\\\\\ ${exp_2.derivation} \\\\\\\\ ${eqString}`,
                            `Apply(${functionName}, ${exp_1.syntax}, ${exp_2.syntax})`,
                            result,
                            initial, final);
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
function ApplyUserLatex(funcName, syntax, paramNames, exp, paramsInfo, initial, final) {
    const paramsString = paramNames.toString();
    let paramsDerivations = "";
    let mapping = " \\{";
    for (let i = 0; i < paramsInfo.length; i++) {
        paramsDerivations += `\\\\\\\\ ${paramsInfo[i].derivation}`;
        mapping += ` ${paramsInfo[i].name} \\mapsto ${paramsInfo[i].value},`;
    }
    mapping = mapping.substring(0, mapping.length - 1) + "\\}";
    return baseInferenceRule('ApplyUser',
                            `\\phi(\\textsc{${funcName}}) = \\textsc{User}(\\langle \\textsc{${paramsString}} \\rangle, \\textsc{${exp.syntax}}) \\\\\\\\ ${paramsString} \\text{ all distinct} \\\\\\\\  \\rho_{${initial.count + 1}} = ${mapping} ${paramsDerivations} \\\\\\\\ ${exp.derivation}`,
                            syntax,
                            exp.value,
                            initial, final);
}

export default {LiteralLatex, 
                VarLatex, 
                IfLatex, 
                SetLatex, 
                BeginLatex, 
                WhileLatex, 
                ApplyLatex, 
                ApplyUserLatex};