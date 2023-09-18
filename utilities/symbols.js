/**
 * makeEqString creates the equivalent string condition in any Primitive
 * inference rule
 * 
 * @param {String} name : Symbol of primitive
 * @param {Integer} value_1 : First int
 * @param {Integer} value_2 : Second int
 * @param {Integer} result : Result of primitive operation
 * @param {JSON} syntax : Syntax for string
 * @returns {String} : The equivalent string condition in Primitive inference rule
 */
function makeEqString(name, value_1, value_2, result, syntax) {
    if (name == "+" || name == "/" || name == "*" || name == "-" || name == "mod") {
        return `-2${syntax.start_sup}31${syntax.end_sup} ${syntax.leq} ${value_1} ${name} ${value_2} < 2${syntax.start_sup}31${syntax.end_sup}`;
    }
    else if (name == "||" || name == "&&") {
        return `${value_1} ${name} ${value_2} = ${result}`
    }
    else if (name == "=") {
        return result == 0 ? `${value_1} ${syntax.neq} ${value_2}` : `${value_1} = ${value_2}`
    } else {
        return `${value_1} ${name} ${value_2} = ${result}`;
    }
}

export {makeEqString}