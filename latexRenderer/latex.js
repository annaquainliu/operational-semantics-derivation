function ticks(ticks, env) {
    return `'`.repeat(ticks[env + '_ticks']);
}

function baseInferenceRule(name, condition, exp_syntax, result, ticks_1, ticks_2, mapping) {
    let envChanges = [ticks(ticks_2, 'xi'), ticks(ticks_2, 'rho')];
    if (mapping != null) {
        envChanges[mapping.index] += mapping.map;
    }
    return  `\\inferrule*[Right=\\textsc{${name}}]{${condition}}{\\state{\\textsc{${exp_syntax}}}{\\xi${ticks(ticks_1, 'xi')}}{\\phi}{\\rho${ticks(ticks_1, 'rho')}} \\Downarrow \\state{\\textsc{${result}}}{\\xi${envChanges[0]}}{\\phi}{\\rho${envChanges[1]}}}`;
}

function LiteralLatex(number, ticks) {
    return baseInferenceRule('Literal', " \\ ", `Literal(${number})`, number, ticks, ticks, null);
}

function VarLatex(title, name, scope, result, ticks) {
   return baseInferenceRule(title, scope, `Var(${name})`, result, ticks, ticks, null);
}

function IfLatex(title, syntax, cond_derivation, condition, branch_derivation, result, ticks_1, ticks_2) {
    return baseInferenceRule(title, `${cond_derivation} \\and ${condition} \\and ${branch_derivation}`,
                            syntax, result, ticks_1, ticks_2, null);
}

function SetLatex(title, conditions, exp, variable, map, ticks_1, ticks_2) {

    return baseInferenceRule(title, conditions, `Set(${variable.syntax}, ${exp.syntax})`, exp.value, ticks_1, ticks_2, map);
}

function BeginLatex(title, derivations, exps_syntax, result, ticks_1, ticks_2) {
    return baseInferenceRule(title, derivations, `Begin(${exps_syntax})`, result, ticks_1, ticks_2, null);
}

function WhileLatex(title, next_while, condition, exp, eqCondition, ticks_1, ticks_2) {
    if (exp.derivation == null) {
        exp.derivation = "";
    }
    return baseInferenceRule(title, `${next_while} \\\\\\\\ ${condition.derivation} \\and ${eqCondition} \\and ${exp.derivation}`, `While(${condition.syntax}, ${exp.syntax})`,
                            0,
                            ticks_1,
                            ticks_2,
                            null);
}

function ApplyLatex(title, functionName, exp_1, exp_2, eqString, syntax, result, ticks_1, ticks_2) {
    return baseInferenceRule(title, `\\phi(${functionName}) = \\textsc{Primitive}(${functionName}) \\\\\\\\ ${exp_1.derivation} \\\\\\\\ ${exp_2.derivation} \\\\\\\\ ${eqString}`,
                            `Apply(${functionName}, ${exp_1.syntax}, ${exp_2.syntax})`,
                            result,
                            ticks_1,
                            ticks_2,
                            null);
}

export default {LiteralLatex, VarLatex, IfLatex, SetLatex, BeginLatex, WhileLatex, ApplyLatex, ticks};