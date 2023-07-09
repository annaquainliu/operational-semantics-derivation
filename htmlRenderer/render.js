import R from './inferenceRules.js';
import HtmlElement from './htmlElement.js';

const latex = document.querySelector('latex');
const renderButton = document.querySelector('renderButton');
const latexOutput = document.querySelector('latexOutput');
latexOutput.style.fontSize = HtmlElement.fontSize;


const initialState = R.State.unchangedState("If(Var(x), Literal(0), Set(Var(x), 1))");
const finalState = new R.State(R.State.noEnvInfo, R.State.envInfo(1, R.State.noMapping), 1);

const ifStatement = new R.If(new R.Var('xi', 'x', R.State.unchangedState('Var(x)'), R.State.unchangedState(0)), 
                                 new R.Set('xi', 'x', R.State.unchangedState("Set(Var(x))"), 
                                                        new R.State(R.State.noEnvInfo, R.State.envInfo(0, {x : 1}), 1)), 
                                 initialState,
                                 finalState);

// latexOutput.innerHTML = new R.Begin([new R.Literal(R.State.unchangedState("Literal(0)"), R.State.unchangedState(0)),
//                                      new R.Literal(R.State.unchangedState("Literal(1)"), R.State.unchangedState(1))],
//                                      R.State.unchangedState("Begin(Literal(0), Literal(1))"),
//                                      R.State.unchangedState(1)).html;

// latexOutput.innerHTML = new R.While(new R.While(HtmlElement.empty(), 
//                                                 new R.Literal(R.State.unchangedState("Literal(0)"), R.State.unchangedState(0)),
//                                                 ifStatement,
//                                                 R.State.unchangedState('While(Literal(0), If(Var(x), Literal(0), Set(Var(x), 1)))'),
//                                                 R.State.unchangedState(0)), 
//                                     new R.Literal(R.State.unchangedState("Literal(1)"), R.State.unchangedState(1)),
//                                     ifStatement,
//                                     R.State.unchangedState('While(Literal(0), If(Var(x), Literal(0), Set(Var(x), 1)))'),
//                                     R.State.unchangedState(0)).html;


