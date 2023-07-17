function ticks(ticks, env) {
    return `'`.repeat(ticks[env + '_ticks']);
}

function baseInferenceRule(name, condition, exp_syntax, result, ticks_1, ticks_2) {
    let envChanges = [ticks(ticks_2, 'xi'), ticks(ticks_2, 'rho')];
    //add mapping if inference rule is set
    if (ticks_2.mapping != null) {
        envChanges[ticks_2.mapping.index] += ticks_2.mapping.map;
    }
    return  `\\inferrule*[Right=\\textsc{${name}}]{${condition}}{\\state{\\textsc{${exp_syntax}}}{\\xi${ticks(ticks_1, 'xi')}}{\\phi}{\\rho${ticks(ticks_1, 'rho')}} \\Downarrow \\state{\\textsc{${result}}}{\\xi${envChanges[0]}}{\\phi}{\\rho${envChanges[1]}}}`;
}

function LiteralLatex(number, ticks) {
    return baseInferenceRule('Literal', " \\ ", `Literal(${number})`, number, ticks, ticks);
}

function VarLatex(title, name, scope, result, ticks) {
   return baseInferenceRule(title, scope, `Var(${name})`, result, ticks, ticks);
}

function IfLatex(title, syntax, cond_derivation, condition, branch_derivation, result, ticks_1, ticks_2) {
    return baseInferenceRule(title, `${cond_derivation} \\and ${condition} \\and ${branch_derivation}`,
                            syntax, result, ticks_1, ticks_2);
}

function SetLatex(title, conditions, exp, variable, map, ticks_1, ticks_2) {
    const afterTicksCopy = JSON.parse(JSON.stringify(ticks_2));
    afterTicksCopy['mapping'] = map;
    return baseInferenceRule(title, conditions, `Set(${variable.syntax}, ${exp.syntax})`, exp.value, ticks_1, afterTicksCopy);
}

function BeginLatex(title, derivations, exps_syntax, result, ticks_1, ticks_2) {
    
    return baseInferenceRule(title, derivations, `Begin(${exps_syntax})`, result, ticks_1, ticks_2);
}

function WhileLatex(title, next_while, condition, exp, eqCondition, ticks_1, ticks_2) {
    if (exp.derivation == null) {
        exp.derivation = "";
    }
    return baseInferenceRule(title, `${next_while} \\\\\\\\ ${condition.derivation} \\and ${eqCondition} \\and ${exp.derivation}`, `While(${condition.syntax}, ${exp.syntax})`,
                            0,
                            ticks_1,
                            ticks_2);
}

function ApplyLatex(title, functionName, exp_1, exp_2, eqString, result, ticks_1, ticks_2) {
    return baseInferenceRule(title, `\\phi(${functionName}) = \\textsc{Primitive}(${functionName}) \\\\\\\\ ${exp_1.derivation} \\\\\\\\ ${exp_2.derivation} \\\\\\\\ ${eqString}`,
                            `Apply(${functionName}, ${exp_1.syntax}, ${exp_2.syntax})`,
                            result,
                            ticks_1,
                            ticks_2);
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
function ApplyUserLatex(funcName, syntax, paramNames, exp, paramsInfo, ticks_1, ticks_2) {
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
                            ticks_1,
                            ticks_2);
}
export default {LiteralLatex, 
                VarLatex, 
                IfLatex, 
                SetLatex, 
                BeginLatex, 
                WhileLatex, 
                ApplyLatex, 
                ApplyUserLatex,
                ticks};