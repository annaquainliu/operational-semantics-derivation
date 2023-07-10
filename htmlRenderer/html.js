import HtmlElement from './htmlElement.js';
const htmlOutput = document.getElementById("HTMLOutput");
htmlOutput.style.fontSize = HtmlElement.fontSize;

// const ticks = {xi_ticks : 0, rho_ticks : 0};
// const unchangedEnvs = R.State.bothEnvInfo(ticks, R.State.noMapping, R.State.noMapping);
// const condition = new R.Literal(0, unchangedEnvs, unchangedEnvs);
// const branch = new R.Literal(1, unchangedEnvs, unchangedEnvs);
// latexOutput.innerHTML = new R.If('IfTrue', 'If(Literal(0), Literal(0), Literal(1))',
//                                 condition, branch, unchangedEnvs, unchangedEnvs).html;

// const initialTicks = {xi_ticks : 0, rho_ticks : 0};
// const unchangedEnvs = R.State.bothEnvInfo(initialTicks, R.State.noMapping, R.State.noMapping);
// const exp = new R.Literal(1, unchangedEnvs, unchangedEnvs);
// const afterEnv = R.State.bothEnvInfo(initialTicks, {x : 1}, R.State.noMapping);
// latexOutput.innerHTML = new R.Set(`FormalAssign`, `Set(Var(x), Literal(1))`, 'rho', 'x', 
//                                                     exp, unchangedEnvs, afterEnv).html;

// const initialTicks = {xi_ticks : 1, rho_ticks : 2};
// const unchangedEnvs = R.State.bothEnvInfo(initialTicks, R.State.noMapping, R.State.noMapping);
// const afterTicks = {xi_ticks: 2, rho_ticks: 0};
// const afterEnv = R.State.bothEnvInfo(afterTicks, {x : 3}, R.State.noMapping);
// latexOutput.innerHTML = new R.Var('GlobalVar', 'xi', 'x', unchangedEnvs, afterEnv).html;

// const initialTicks = {xi_ticks : 1, rho_ticks : 2};
// const unchangedEnvs = R.State.bothEnvInfo(initialTicks, R.State.noMapping, R.State.noMapping);
// const Literal1 = new R.Literal(0, unchangedEnvs, unchangedEnvs);
// const Literal2 = new R.Literal(2, unchangedEnvs, unchangedEnvs);
// const apply = new R.Apply('ApplyAdd', 'Apply(+, Literal(0), Literal(2))', 2, 
//                                     R.Apply.makeCondInfo('+', `-2^32 <= 2 + 0 < 2^32`, Literal1, Literal2),
//                                     unchangedEnvs,
//                                     unchangedEnvs);
// latexOutput.innerHTML = apply.html;
