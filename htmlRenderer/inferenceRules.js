import HtmlElement from './htmlElement.js';

class State extends HtmlElement {
    static xi = 'ξ';
    static rho = 'ρ';
    static phi = 'Φ';
    static envs = {'xi' : State.xi, 'rho' : State.rho, 'phi' : State.phi};
    static mapsTo = '→';
    static langle = '〈';
    static rangle = '〉';
    static noMapping = null;
    static noEnvInfo = null;
    /**
     * 
     * @param {String} rho 
     * @param {String} phi 
     * @param {String} xi 
     * @param {String} param 
     */
    constructor(state, param) {
        super('div', {}, [], `${State.langle}${param},${State.xi}${state.xi},${State.phi},${State.rho}${state.rho}${State.rangle}`, {});
        this.param = param;
    }

    static unchangedState(param) {
        return new State(`${State.rho}`, `${State.phi}`,`${State.phi}`, param);
    }
}

// takes in 2 states
class Judgement extends HtmlElement {
    static downarrow = '⇓';
    constructor (initialState, finalState) {
        let style = {width : '100%', display : 'flex', 'flex-direction' : 'row', 'justify-content' : 'center', 'border-top' : 'solid black 1px'};
        const downarrowDiv = HtmlElement.text(Judgement.downarrow);
        super('div', style, [initialState, downarrowDiv, finalState], '', {});
        this.initialState = initialState;
        this.finalState = finalState;
    }
}

// conditions : [] HtmlElement
class Conditions extends HtmlElement {

    constructor(conditions, orientation) {
        if (conditions.length == 0) {
            conditions.push(HtmlElement.space());
        }
        let style = {width : '100%', height : '50%', 'display' : 'flex', 'flex-direction' : orientation, 
                    'justify-content' : 'space-evenly', 'align-items' : 'center'};
        if (orientation == "row") {
            style['align-items'] = 'flex-end';
        }
        super('div', style, conditions, '', {});
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

    constructor(title, conditions, syntax, result, initial, final) {
        const initialState = new State(initial, syntax);
        const finalState = new State(final, result);
        const judgement = new Judgement(initialState, finalState);
        const ruleStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 
                           'flex-direction' : 'column', 'white-space': 'nowrap'};
        const ruleAndNameStyle = {width : 'fit-content', height : 'fit-content', display : 'flex', 
                                'flex-direction' : 'row', 'vertical-align' : 'bottom', 'white-space': 'nowrap',
                                'color' : 'black'};
        const ruleElement = new HtmlElement('div', ruleStyle, [conditions, judgement], '', {});
        const nameElement = new HtmlElement('div', {width : 'fit-content', 'white-space' : 'no-wrap', 
                                                    'align-self' : 'flex-end', 'padding-bottom' : HtmlElement.fontSize, 
                                                    'padding-left' : '0.5vw'}, [], title, {});
        super('div', ruleAndNameStyle, [ruleElement, nameElement], '', {'onmouseenter' : `this.style.color = 'red'`,
                                                                        'onmouseout' : `this.style.color = 'black'`});
        this.name = title;
        this.judgement = judgement;
        this.conditions = conditions;
        this.initialState = initialState;
        this.finalState = finalState;
        this.result = finalState.param;
    }

}

class If extends InferenceRule {

    constructor(title, syntax, result, cond_derive, cond_result, 
                                branch_derive, initial, final) {
        let condition;
        if (cond_result == 0) {
            condition = HtmlElement.conditionText(`${cond_result} = 0`, 'row');
        } else {
            condition = HtmlElement.conditionText(`${cond_result} ≠ 0`, 'row');
        }
        const conditions = new Conditions([cond_derive, condition, branch_derive], 'row');
        super(title, conditions, syntax, result, initial, final);
    }
    
}

class Literal extends InferenceRule {

    constructor(value, state) {
        super("Literal", new Conditions([HtmlElement.space()], 'row'), `Literal(${value})`, 
              value, state, state);
    }
}

class Set extends InferenceRule {

    constructor(title, syntax, env, name, exp, initial, final) {
        let conditions = Var.scopeCondition(env, name, initial);
        conditions.addCondition(exp);
        super(title, conditions, syntax, exp.result, initial, final);
    }
}

class Var extends InferenceRule {

    constructor(title, env, name, value, state) {
        const conditions = Var.scopeCondition(env, name, state);
        super(title, conditions, `Var(${name})`, `${value}`, state, state);
        this.result = value;
    }

    static scopeCondition(env, name, state) {
        if (env == "rho") {
            return new Conditions([HtmlElement.conditionText(`${name} ∈ dom ${State.rho}${state.rho}`, 'row')], 'row');
        } else {
            return new Conditions([HtmlElement.conditionText(`${name} ∉ dom ${State.rho}${state.rho}`, 'row'), 
                                  HtmlElement.conditionText(`${name} ∈ dom ${State.xi}${state.xi}`, 'row')], 
                                  'row');
        }
    }
}

class Begin extends InferenceRule {

    constructor(title, syntax, result, exp_derivations, envs) {
        exp_derivations.reverse();
        const conditions = new Conditions(exp_derivations, 'column');
        super(title, conditions, `Begin(${syntax})`, result, envs);
    }
}

class While extends InferenceRule {

    constructor(title, syntax, next_while, cond_derive, exp_derive, initial, final) {
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
        super(title, nextWhileCondition, syntax, 0, initial, final);
    }   
}

class Apply extends InferenceRule {

    static leq = '≤';
    static neq = '≠';
    constructor(title, syntax, result, condInfo, initial, final) {
        const functionCondition = HtmlElement.conditionText(`${State.phi}(${condInfo.name}) = Primitive(${condInfo.name})`, 'column');
        let eqText = Apply.makeEqString(condInfo.name, condInfo.exp_1.result, condInfo.exp_2.result, result);
        const eqString = HtmlElement.conditionText(eqText, 'column');
        const conditions = new Conditions([eqString, condInfo.exp_2, condInfo.exp_1, functionCondition], 'column');
        super(title, conditions, syntax, result, initial, final);
    }   

    static makeCondInfo(functionName, exp1_element, exp2_element) {
        return {name : functionName, exp_1 : exp1_element, exp_2 : exp2_element};
    }

    static makeEqString(name, value_1, value_2, result) {
        if (name == "+" || name == "/" || name == "*" || name == "-" || name == "mod") {
            return `-2<sup>31</sup> ${Apply.leq} ${value_1} ${name} ${value_2} < 2<sup>31</sup>`;
        }
        else if (name == "||" || name == "&&") {
            return `${value_1} ${name} ${value_2} = ${result}`
        }
        else if (name == "=") {
            return result == 0 ? `${value_1} ${Apply.neq} ${value_2}` : `${value_1} = ${value_2}`
        } else {
            return `${value_1} ${name} ${value_2} = ${result}`;
        }
    }
}

class ApplyUser extends InferenceRule {

    constructor(funName, syntax, paramNames, paramsInfos, body, initial, final) {
        const paramsString = paramNames.toString();
        let allDistinctCond;
        if (paramsString == "") {
            allDistinctCond = HtmlElement.empty();
        } else {
            allDistinctCond = HtmlElement.conditionText(`${paramsString} all distinct`, 'column');
        }
        const rhoAndParams = ApplyUser.makeRhoAndParams(paramsInfos);
        const conditionList = [body.derivation, 
                              HtmlElement.conditionText(`${State.rho} = ${rhoAndParams.rhoMapping}`, 'column')]
                              .concat(rhoAndParams.paramsDerivations)
                              .concat([
                                allDistinctCond,
                                HtmlElement.conditionText(`${State.rho}(${funName}) = User([${paramsString}], ${body.syntax})`, 'column')
                              ]);
        const conditions = new Conditions(conditionList, 'column');
        super('ApplyUser', conditions, syntax, body.value, envs);
    }

    /**
     * Makes the new rho scoped in the function and returns an array of HtmlElements of 
     * the parameters derivations
     * @param {Array of JSON} paramsInfo 
     * @returns {JSON} : {rhoMapping : string, paramsDerivations : Array of HtmlElement}
     */
    static makeRhoAndParams(paramsInfo) {
        if (paramsInfo.length == 0) {
            return {'rhoMapping' : '{}', 'paramsDerivations' : []};
        }
        let paramsDerivations = [];
        let mapping = "{";
        for (let i = 0; i < paramsInfo.length; i++) {
            paramsDerivations.push(paramsInfo[i].derivation);
            mapping += `${paramsInfo[i].name} ${State.mapsTo} ${paramsInfo[i].value}, `;
        }
        paramsDerivations.reverse();
        mapping = mapping.substring(0, mapping.length - 2) + "}";
        return {'rhoMapping' : mapping, 'paramsDerivations' : paramsDerivations};
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
                Apply : Apply,
                ApplyUser : ApplyUser};
