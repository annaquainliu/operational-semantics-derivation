import HtmlElement from './htmlElement.js';

class State extends HtmlElement {
    static xi = 'ξ';
    static rho = 'ρ';
    static phi = 'Φ';
    static envs = {'xi' : State.xi, 'rho' : State.rho, 'phi' : State.phi};
    static noMapping = null;
    static noEnvInfo = null;
    constructor(rhoInfo, xiInfo, param) {
        console.log(xiInfo);
        let xi_env = State.envNotation(State.xi, xiInfo);
        let rho_env = State.envNotation(State.rho, rhoInfo);
        super('div', {}, [], `〈${param},${xi_env},${State.phi},${rho_env}〉`);
        this.param = param;
    }

    static unchangedState(param) {
        return new State(State.noEnvInfo, State.noEnvInfo, param);
    }

    static envNotation(env, info) {
        if (info == null) {
            return env;
        }
        let notation = env + "'".repeat(info.ticks);
        if (info.mapping != null) {
            const key = Object.keys(info.mapping)[0];
            notation += `{${key} → ${info.mapping[key]}}`;
        }
        return notation;
    }

    static envInfo(ticks, mapping) {
        return {ticks : ticks, mapping : mapping};
    }
}

// takes in 2 states
class Judgement extends HtmlElement {
    static downarrow = '⇓';
    constructor (initialState, finalState) {
        let style = {width : '100%', display : 'flex', 'flex-direction' : 'row', 'justify-content' : 'center', 'border-top' : 'solid black 1px'};
        const downarrowDiv = HtmlElement.text(Judgement.downarrow);
        super('div', style, [initialState, downarrowDiv, finalState], '');
        this.initialState = initialState;
        this.finalState = finalState;
    }
}

// conditions : [] HtmlElement
class Conditions extends HtmlElement {

    constructor(conditions, orientation) {
        let style = {width : '100%', height : '50%', 'display' : 'flex', 'flex-direction' : orientation, 
                    'justify-content' : 'space-evenly', 'align-items' : 'center'};
        if (orientation == "row") {
            style['align-items'] = 'flex-end';
        }
        super('div', style, conditions, '');
        this.conditions = conditions;
    }

    get conditionLength() {
        return this.conditions.length;
    }

    nthCondition(n) {
        if (n >= this.conditionLength) {
            throw new Error(`${n} is an out of bound index when the length is ${this.conditionLength}`);
        } 
        return this.conditions[n];
    }
}

class InferenceRule extends HtmlElement {

    constructor(name, conditions, initialState, finalState) {
        const judgement = new Judgement(initialState, finalState);
        const ruleStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 'flex-direction' : 'column'};
        const ruleAndNameStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 'flex-direction' : 'row',
                                  'vertical-align' : 'bottom'};
        const ruleElement = new HtmlElement('div', ruleStyle, [conditions, judgement], '');
        const nameElement = new HtmlElement('div', {width : 'fit-content', 'white-space' : 'no-wrap', 
                                                    'align-self' : 'flex-end', 'padding-bottom' : HtmlElement.fontSize, 
                                                    'padding-left' : '0.5vw'}, [], name);
        super('div', ruleAndNameStyle, [ruleElement, nameElement], '');
        this.name = name;
        this.judgement = judgement;
        this.conditions = conditions;
        this.initialState = initialState;
        this.finalState = finalState;
        this.result = finalState.param;
    }
}

class If extends InferenceRule {

    constructor(cond_derive, branch_derive, initialState, finalState) {
        let condition, name;
        let conditionResult = cond_derive.result;
        // const style = {'white-space': 'nowrap', 'align-self' : 'flex-end', 'padding-left' : '1vw', 'padding-right' : '1vw'}
        if (conditionResult == 0) {
            condition = HtmlElement.conditionText(`${conditionResult} = 0`);
            name = "IfFalse";
        } else {
            condition = HtmlElement.conditionText(`${conditionResult} ≠ 0`);
            name = "IfTrue";
        }
        const conditions = new Conditions([cond_derive, condition, branch_derive], 'row');
        super(name, conditions, initialState, finalState);
    }

}

class Literal extends InferenceRule {

    constructor(initialState, finalState) {
        super("Literal", new Conditions([HtmlElement.space()], 'row'), initialState, finalState);
    }
}

class Set extends InferenceRule {

    constructor(env, name, initialState, finalState) {
        let conditions = Var.scopeCondition(env, name);
        let inferenceRuleName;
        if (env == "rho") {
            inferenceRuleName = 'FormalAssign';
        } else {
            inferenceRuleName = 'GlobalAssign';
        }
        super(inferenceRuleName, conditions, initialState, finalState);
    }
}

class Var extends InferenceRule {

    constructor(env, name, initialState, finalState) {
        let conditions = Var.scopeCondition(env, name);
        let inferenceRuleName;
        if (env == "rho") {
            inferenceRuleName = 'FormalVar';
        } else {
            inferenceRuleName = 'GlobalVar';
        }
        super(inferenceRuleName, conditions, initialState, finalState);
    }

    static scopeCondition(env, name) {
        if (env == "rho") {
            return new Conditions([HtmlElement.conditionText(`${name} ∈ ${State.rho}`)], 'row');
    
        } else {
            return new Conditions([HtmlElement.conditionText(`${name} ∉ ${State.rho}`), 
                                        HtmlElement.conditionText(`${name} ∈ ${State.xi}`)], 'row');
        }
    }
}

// have not debugged this

class Begin extends InferenceRule {

    constructor(exp_derivations, initialState, finalState) {
        const conditions = new Conditions(exp_derivations, 'column');
        super('Begin', conditions, initialState, finalState);
    }
}

class While extends InferenceRule {

    constructor(next_while, cond_derive, exp_derive, initialState, finalState) {
        let name = "";
        let conditionsArray = [cond_derive];
        if (cond_derive.result == 0) {
            name = "WhileEnd";
            conditionsArray.push(HtmlElement.conditionText(`${cond_derive.result} = 0`));
        } else {
            name = "WhileIterate";
            conditionsArray.push(HtmlElement.conditionText(`${cond_derive.result} ≠ 0`));
            conditionsArray.push(exp_derive);
        }
        const conditions = new Conditions(conditionsArray, 'row');
        const nextWhileCondition = new Conditions([next_while, conditions], 'column');
        super(name, nextWhileCondition, initialState, finalState);
    }   
}

class Apply extends InferenceRule {
    constructor() {
        
    }
}

export default {InferenceRule: InferenceRule, 
                Conditions: Conditions, 
                Judgement: Judgement, 
                State : State,
                If : If,
                Literal : Literal,
                Set : Set,
                Var : Var,
                Begin : Begin,
                While : While};
