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

    constructor(rhoInfo, xiInfo, param) {
        let xi_env = State.envNotation(State.xi, xiInfo);
        let rho_env = State.envNotation(State.rho, rhoInfo);
        super('div', {}, [], `${State.langle}${param},${xi_env},${State.phi},${rho_env}${State.rangle}`, {});
        this.param = param;
    }

    static unchangedState(param) {
        return new State(State.noEnvInfo, State.noEnvInfo, param);
    }
   
    /**
     * Takes in the specified environment (xi or rho), the envInfo of the specific 
     * environment, and returns the notation of the environment in Opsem
     * 
     * @param {String} env : The specified environment
     * @param {JSON} info : {ticks : number, mapping : {name : string, value : number}}
     * @returns {String} : The notation of the environment in Opsem
     */
    static envNotation(env, info) {
        if (info == null) {
            return env;
        }
        let notation = env + "'".repeat(info.ticks);
        if (info.mapping != null) {
            notation += `{${info.mapping.name} ${State.mapsTo} ${info.mapping.value}}`;
        }
        return notation;
    }

    /**
     * Takes in the number of ticks in ONE environment and the
     * JSON of the current environment mapping and returns
     * a JSON recording the ticks and mapping of the environment 
     * at a certain state.
     * 
     * @param {Number} ticks 
     * @param {JSON} mapping : {name : string, value : number} 
     * @returns {JSON} : {ticks : number, mapping : mapping}
     */
    static envInfo(ticks, mapping) {
        return {ticks : ticks, mapping : mapping};
    }
    
    /**
     * Takes in a JSON of the number of ticks in each environment and 
     * the JSON of the mapping of the rho and xi environment and
     * returns a JSON recording the ticks and mapping of the 
     * rho AND xi environment
     * 
     * 
     * @param {JSON} ticks : {rho_ticks : number, xi_ticks : number}
     * @param {JSON} rho_map : {name : string, value : number}
     * @param {JSON} xi_map : {name : string, value : number}
     * @returns {JSON} of the ticks in each environment and the mapping in each 
     *                 environment
     */
    static bothEnvInfo(ticks, rho_map, xi_map) {
        return {ticks : ticks, mapping : {xi : xi_map, rho : rho_map}};
    }

    /**
     * Takes in only a JSON recording the amount of ticks in the xi and
     * rho environment and returns a JSON recording the ticks of both environments 
     * (with no mappings)
     * 
     * @param {JSON} ticks : {rho_ticks : number, xi_ticks : number}
     * @returns {JSON} : {ticks : ticks, mapping : {xi : null, rho : null}}
     */
    static bothEnvTicksInfo(ticks) {
        return State.bothEnvInfo(ticks, null, null);
    }

    /**
     * Takes in the envInfos (in the format (rom the function `bothEnvInfos`) 
     * and the specified environment and returns the visual ticks 
     * on that environment.
     * 
     * @param {JSON} envInfos : {ticks : {rho_ticks : number, xi_ticks : number}, mapping : JSON}
     * @param {String} env : The specified environment (xi or rho)
     * @returns {String} : The current amount of ticks in the specified env 
     */
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

    constructor(title, conditions, syntax, result, beforeEnv, afterEnv) {
        const initialState = InferenceRule.makeState(syntax, beforeEnv);
        const finalState = InferenceRule.makeState(result, afterEnv);
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

    /**
     * 
     * @param {String} syntax : The AST of the expression/value
     * @param {JSON} envInfo : {ticks : 
     *                              {rho_ticks : number, 
     *                               xi_ticks: number}, 
     *                          mapping : 
     *                               {rho : {name : string, value : number},
     *                               {xi : {name : string, value : number}}}
     *                         } 
     * @returns {State} 
     */
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

    constructor(title, env, name, value, beforeEnv, afterEnv) {
        const conditions = Var.scopeCondition(env, name, beforeEnv);
        const ticks = State.getTicksFromEnvs(afterEnv, env);
        super(title, conditions, `Var(${name})`, `${value}`, beforeEnv, afterEnv);
        this.result = value;
    }

    static scopeCondition(env, name, beforeEnv) {
        const rhoTicks = State.getTicksFromEnvs(beforeEnv, 'rho');
        const xiTicks = State.getTicksFromEnvs(beforeEnv, 'xi');
        if (env == "rho") {
            return new Conditions([HtmlElement.conditionText(`${name} ∈ dom ${State.rho}${rhoTicks}`, 'row')], 'row');
        } else {
            return new Conditions([HtmlElement.conditionText(`${name} ∉ dom ${State.rho}${rhoTicks}`, 'row'), 
                                  HtmlElement.conditionText(`${name} ∈ dom ${State.xi}${xiTicks}`, 'row')], 
                                  'row');
        }
    }
}

class Begin extends InferenceRule {

    constructor(title, syntax, result, exp_derivations, beforeEnv, afterEnv) {
        exp_derivations.reverse();
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
    static neq = '≠';
    constructor(title, syntax, result, condInfo, beforeEnv, afterEnv) {
        const functionCondition = HtmlElement.conditionText(`${State.phi}(${condInfo.name}) = Primitive(${condInfo.name})`, 'column');
        let eqText = Apply.makeEqString(condInfo.name, condInfo.exp_1.result, condInfo.exp_2.result, result);
        const eqString = HtmlElement.conditionText(eqText, 'column');
        const conditions = new Conditions([eqString, condInfo.exp_2, condInfo.exp_1, functionCondition], 'column');
        super(title, conditions, syntax, result, beforeEnv, afterEnv);
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

    constructor(funName, syntax, paramNames, paramsInfos, body, beforeEnv, afterEnv) {
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
                                HtmlElement.conditionText(`${State.rho}(${funName}) = User(${State.langle}${paramsString}${State.rangle}, ${body.syntax})`, 'column')
                              ]);
        const conditions = new Conditions(conditionList, 'column');
        super('ApplyUser', conditions, syntax, body.value, beforeEnv, afterEnv);
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
