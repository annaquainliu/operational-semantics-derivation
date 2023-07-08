import RULES from './inferenceRules.js';
import HtmlElement from './htmlElement.js';

const latex = document.querySelector('latex');
const renderButton = document.querySelector('renderButton');
const latexOutput = document.querySelector('latexOutput');




const initialState = new RULES.State(0, 0, "If(Literal(0), Literal(0), Literal(1))");
const finalState = new RULES.State(0, 4, 0);

latexOutput.innerHTML = new RULES.If(new RULES.Literal(new RULES.State(0, 0, "Literal(0)"), new RULES.State(0, 0, 0)), 
                                    new RULES.Literal(new RULES.State(0, 0, "Literal(1)"), new RULES.State(0, 4, 1)), 
                                    initialState, 
                                    finalState).html;