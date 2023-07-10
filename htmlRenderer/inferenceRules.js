import HtmlElement from './htmlElement.js';

class State extends HtmlElement {
    static xi = 'ξ';
    static rho = 'ρ';
    static phi = 'Φ';
    static envs = {'xi' : State.xi, 'rho' : State.rho, 'phi' : State.phi};
    static noMapping = null;
    static noEnvInfo = null;
    constructor(rhoInfo, xiInfo, param) {
        let xi_env = State.envNotation(State.xi, xiInfo);
        let rho_env = State.envNotation(State.rho, rhoInfo);
        super('div', {}, [], `〈${param},${xi_env},${State.phi},${rho_env}〉`);
        this.param = param;
    }

    static unchangedState(param) {
        return new State(State.noEnvInfo, State.noEnvInfo, param);
    }
    // info : {ticks : _, mapping : {name : value}}
    static envNotation(env, info) {
        if (info == null) {
            return env;
        }
        let notation = env + "'".repeat(info.ticks);
        if (info.mapping != null) {
            notation += `{${info.mapping.name} → ${info.mapping.value}}`;
        }
        return notation;
    }

    static envInfo(ticks, mapping) {
        return {ticks : ticks, mapping : mapping};
    }
    //  map : {name : name, value : value}
    static bothEnvInfo(ticks, rho_map, xi_map) {
        return {ticks : ticks, mapping : {xi : xi_map, rho : rho_map}};
    }

    static getTicksFromEnvs(envInfos, env) {
        const times = envInfos.ticks[`${env}_ticks`];
        return "'".repeat(times);
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

    addCondition(htmlElement) {
        this.conditions.push(htmlElement);
    }
}

class InferenceRule extends HtmlElement {

    constructor(name, conditions, syntax, result, beforeEnv, afterEnv) {
        const initialState = InferenceRule.makeState(syntax, beforeEnv);
        const finalState = InferenceRule.makeState(result, afterEnv);
        const judgement = new Judgement(initialState, finalState);
        const ruleStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 
                                                            'flex-direction' : 'column'};
        const ruleAndNameStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 
                                'flex-direction' : 'row', 'vertical-align' : 'bottom'};
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

    // envInfo : {ticks : ticks, mapping : mapping};
    // ticks : {rho_ticks : _, xi_ticks : _}
    // mapping : {xi : JSON, rho : JSON}
    static makeState(syntax, envInfo) {
        return new State(State.envInfo(envInfo.ticks.rho_ticks, envInfo.mapping.rho),
                         State.envInfo(envInfo.ticks.xi_ticks, envInfo.mapping.xi), 
                         syntax);
    }

}

class If extends InferenceRule {

    constructor(title, syntax, result, cond_derive, cond_result, 
                                branch_derive, beforeEnv, afterEnv) {
        let condition;
        if (cond_result == 0) {
            condition = HtmlElement.conditionText(`${cond_result} = 0`, 'row');
        } else {
            condition = HtmlElement.conditionText(`${cond_result} ≠ 0`, 'row');
        }
        const conditions = new Conditions([cond_derive, condition, branch_derive], 'row');
        super(title, conditions, syntax, result, beforeEnv, afterEnv);
    }
    
}

class Literal extends InferenceRule {

    constructor(value, beforeEnv, afterEnv) {
        // new Conditions([HtmlElement.space()], 'row'), initialState, finalState
        super("Literal", new Conditions([HtmlElement.space()], 'row'), `Literal(${value})`, 
              value, beforeEnv, afterEnv);
    }
}

class Set extends InferenceRule {

    constructor(title, syntax, env, name, exp, beforeEnv, afterEnv) {
        let conditions = Var.scopeCondition(env, name, beforeEnv);
        conditions.addCondition(exp);
        super(title, conditions, syntax, exp.result, beforeEnv, afterEnv);
    }
}

class Var extends InferenceRule {

    constructor(title, env, name, beforeEnv, afterEnv) {
        const conditions = Var.scopeCondition(env, name, beforeEnv);
        const ticks = State.getTicksFromEnvs(afterEnv, env);
        super(title, conditions, `Var(${name})`, `${State.envs[env]}${ticks}(${name})`, beforeEnv, afterEnv);
    }

    static scopeCondition(env, name, beforeEnv) {
        const rhoTicks = State.getTicksFromEnvs(beforeEnv, 'rho');
        const xiTicks = State.getTicksFromEnvs(beforeEnv, 'xi');
        if (env == "rho") {
            return new Conditions([HtmlElement.conditionText(`${name} ∈ dom ${State.rho}${rhoTicks}`, 
                                                            'row')], 'row');
        } else {
            return new Conditions([HtmlElement.conditionText(`${name} ∉ dom ${State.rho}${rhoTicks}`, 'row'), 
                                  HtmlElement.conditionText(`${name} ∈ dom ${State.xi}${xiTicks}`, 'row')], 
                                  'row');
        }
    }
}

class Begin extends InferenceRule {

    constructor(title, syntax, result, exp_derivations, beforeEnv, afterEnv) {
        const conditions = new Conditions(exp_derivations, 'column');
        super(title, conditions, `Begin(${syntax})`, result, beforeEnv, afterEnv);
    }
}

class While extends InferenceRule {

    constructor(title, syntax, next_while, cond_derive, exp_derive, beforeEnv, afterEnv) {
        let conditionsArray = [cond_derive];
        if (cond_derive.result == 0) {
            conditionsArray.push(HtmlElement.conditionText(`${cond_derive.result} = 0`, 'row'));
            next_while = HtmlElement.empty();
        } else {
            conditionsArray.push(HtmlElement.conditionText(`${cond_derive.result} ≠ 0`, 'row'));
            conditionsArray.push(exp_derive);
        }
        const conditions = new Conditions(conditionsArray, 'row');
        const nextWhileCondition = new Conditions([next_while, conditions], 'column');
        super(title, nextWhileCondition, syntax, 0, beforeEnv, afterEnv);
    }   
}

class Apply extends InferenceRule {

    static leq = '≤';
    constructor(title, syntax, result, condInfo, beforeEnv, afterEnv) {
        const functionCondition = HtmlElement.conditionText(`${State.phi}(${condInfo.name}) = Primitive(${condInfo.name})`, 'column');
        condInfo.eqString = condInfo.eqString.replace('\\leq', Apply.leq);
        condInfo.eqString = condInfo.eqString.replaceAll('^{31}', "<sup>31</sup>");
        const eqString = HtmlElement.conditionText(condInfo.eqString, 'column');
        const conditions = new Conditions([functionCondition, condInfo.exp_1, 
                                            condInfo.exp_2, eqString], 'column');
        super(title, conditions, syntax, result, beforeEnv, afterEnv);
    }   

    static makeCondInfo(functionName, eqString, exp1_element, exp2_element) {
        return {name : functionName, eqString : eqString, 
                    exp_1 : exp1_element, exp_2 : exp2_element};
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
                While : While,
                Apply : Apply};
