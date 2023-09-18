import HtmlElement from './htmlElement.js';
import {Syntax, translateEnvIntoWords, EnvChanges} from "../utilities/environment.js"

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
    static syntax = new Syntax("{", "}", State.xi, State.rho, State.phi, State.mapsTo, "<sub>", "</sub>", State.langle, State.rangle);

    /**
     * 
     * @param {String} rho 
     * @param {String} phi 
     * @param {String} xi 
     * @param {String} param 
     */
    constructor(xi, phi, rho, param) {
        super('div', {}, [], `${State.langle}${param},${xi},${phi},${rho}${State.rangle}`, {});
        this.param = param;
    }

    static unchangedState(param) {
        return new State(`${State.rho} = {}`, `${State.phi} = {}`,`${State.phi} = {}`, param);
    }

    /**
     * Takes in the specified environment (xi, rho, or phi), the mapping, 
     * and returns the notation of the environment in Opsem
     * 
     * @param {String} env : The specified environment
     * @param {JSON} obj : 
     * @returns {String} : The notation of the environment in Opsem
     */
    static envNotation(env, obj) {
        return translateEnvIntoWords(env, obj, State.syntax);
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

    constructor(title, conditions, syntax, result, envs) {
        const xi = State.envNotation("xi", envs.xi);
        const phi = State.envNotation("phi", envs.phi);
        const rho_1 = State.envNotation("phi", envs.rho_1);
        const rho_2 = State.envNotation("phi", envs.rho_2);
        const initialState = new State(xi, phi, rho_1, syntax);
        const finalState = new State(xi, phi, rho_2, result);
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
                                branch_derive, envs) {
        let condition;
        if (cond_result == 0) {
            condition = HtmlElement.conditionText(`${cond_result} = 0`, 'row');
        } else {
            condition = HtmlElement.conditionText(`${cond_result} ≠ 0`, 'row');
        }
        const conditions = new Conditions([cond_derive, condition, branch_derive], 'row');
        super(title, conditions, syntax, result, envs);
    }
    
}

class Literal extends InferenceRule {

    constructor(value, envs) {
        super("Literal", new Conditions([HtmlElement.space()], 'row'), `Literal(${value})`, 
              value, envs);
    }
}

class Set extends InferenceRule {

    constructor(title, syntax, env, name, exp, envs) {
        let conditions = Var.scopeCondition(env, name);
        conditions.addCondition(exp);
        super(title, conditions, syntax, exp.result, envs);
    }
}

class Var extends InferenceRule {

    constructor(title, env, name, value, envs) {
        const conditions = Var.scopeCondition(env, name);
        super(title, conditions, `Var(${name})`, `${value}`, envs);
        this.result = value;
    }

    static scopeCondition(env, name) {
        if (env == "rho") {
            return new Conditions([HtmlElement.conditionText(`${name} ∈ dom ${State.rho}`, 'row')], 'row');
        } else {
            return new Conditions([HtmlElement.conditionText(`${name} ∉ dom ${State.rho}`, 'row'), 
                                  HtmlElement.conditionText(`${name} ∈ dom ${State.xi}`, 'row')], 
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

    constructor(title, syntax, next_while, cond_derive, exp_derive, envs) {
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
        super(title, nextWhileCondition, syntax, 0, envs);
    }   
}

class Apply extends InferenceRule {

    static leq = '≤';
    static neq = '≠';
    constructor(title, syntax, result, condInfo, envs) {
        const functionCondition = HtmlElement.conditionText(`${State.phi}(${condInfo.name}) = Primitive(${condInfo.name})`, 'column');
        let eqText = Apply.makeEqString(condInfo.name, condInfo.exp_1.result, condInfo.exp_2.result, result);
        const eqString = HtmlElement.conditionText(eqText, 'column');
        const conditions = new Conditions([eqString, condInfo.exp_2, condInfo.exp_1, functionCondition], 'column');
        super(title, conditions, syntax, result, envs);
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

    constructor(funName, syntax, paramNames, paramsInfos, body, envs) {
        const paramsString = paramNames.toString();
        let allDistinctCond;
        if (paramsString == "") {
            allDistinctCond = HtmlElement.empty();
        } else {
            allDistinctCond = HtmlElement.conditionText(`${paramsString} all distinct`, 'column');
        }
        const rhoAndParams = makeRhoAndParams(paramsInfos);
        const conditionList = [body.derivation, 
                              HtmlElement.conditionText(`${State.rho} = ${rhoAndParams.rhoMapping}`, 'column')]
                              .concat(rhoAndParams.paramsDerivations)
                              .concat([
                                allDistinctCond,
                                HtmlElement.conditionText(`${State.rho}(${funName}) = User(${State.langle}${paramsString}${State.rangle}, ${body.syntax})`, 'column')
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
    makeRhoAndParams(paramsInfo) {
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
