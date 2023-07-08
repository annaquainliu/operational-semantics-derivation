import HtmlElement from './htmlElement.js';

class State extends HtmlElement {
    static xi = 'ξ';
    static rho = 'ρ';
    static phi = 'Φ';
    constructor(rho_ticks, xi_ticks, param) {
        let xi_env = State.xi + "'".repeat(xi_ticks);
        let rho_env = State.rho + "'".repeat(rho_ticks);
        super('div', {}, [], `〈${param},${xi_env},${State.phi},${rho_env}〉`);
        this.param = param;
    }
}

// takes in 2 states
class Judgement extends HtmlElement {
    static downarrow = '⇓';
    constructor (initialState, finalState) {
        let style = {width : '100%', display : 'flex', 'flex-direction' : 'row', 'justify-content' : 'center', 'border-top' : 'solid black 1px'};
        const downarrowDiv = new HtmlElement('span', {}, [], Judgement.downarrow);
        super('div', style, [initialState, downarrowDiv, finalState], '');
    }
}

// conditions : [] HtmlElement
class Conditions extends HtmlElement {

    constructor(conditions) {
        let style = {width : '100%', height : '50%', 'display' : 'flex', 'flex-direction' : 'row', 'justify-content' : 'space-evenly'};
        super('div', style, conditions, '');
    }
}

class InferenceRule extends HtmlElement {

    constructor(name, conditions, initialState, finalState) {
        const judgement = new Judgement(initialState, finalState);
        const ruleStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 'flex-direction' : 'column'};
        const ruleAndNameStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 'flex-direction' : 'row'};
        const ruleElement = new HtmlElement('div', ruleStyle, [conditions, judgement], '');
        const nameElement = new HtmlElement('div', {width : '10%', 'white-space' : 'no-wrap', 
                                                    'align-self' : 'flex-end', 'padding-bottom' : '1.3vw', 
                                                    'padding-left' : '0.5vw'}, [], name);
        super('div', ruleAndNameStyle, [ruleElement, nameElement], '');
        this.name = name;
    }
}

class If extends InferenceRule {

    constructor(cond_derive, branch_derive, initialState, finalState) {
        let condition, name;
        let result = finalState.param;
        const style = {'white-space': 'nowrap', 'align-self' : 'flex-end', 'padding-left' : '1vw', 'padding-right' : '1vw'}
        if (result == 0) {
            condition = new HtmlElement('div', style, [], `${result} = 0`);
            name = "IfFalse";
        } else {
            condition = new HtmlElement('div', style, [], `${result} ≠ 0`);
            name = "IfTrue";
        }
        const conditions = new Conditions([cond_derive, condition, branch_derive]);
        super(name, conditions, initialState, finalState);
    }
}

class Literal extends InferenceRule {

    constructor(initialState, finalState) {
        super("Literal", new Conditions([new HtmlElement('div', {}, [], '&nbsp;')]), initialState, finalState);
    }
}

export default {InferenceRule: InferenceRule, 
                Conditions: Conditions, 
                Judgement: Judgement, 
                State : State,
                If : If,
                Literal : Literal};