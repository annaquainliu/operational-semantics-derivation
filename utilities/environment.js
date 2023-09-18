

/**
 * Static class that records the changes of environments rho and xi
 */
class EnvChanges {
    static rho_changes = ""
    static xi_changes = ""
    static rho_count = 0

    static reset() {
        EnvChanges.rho_changes = ""
        EnvChanges.xi_changes = ""
        EnvChanges.rho_count = 0
    }

    static get latex_rho() {
        if (EnvChanges.rho_count == 0) {
            return EnvChanges.rho_changes
        }
        return `_{${EnvChanges.rho_count}}${EnvChanges.rho_changes}`;
    }

    static get html_rho() {
        if (EnvChanges.rho_count == 0) {
            return EnvChanges.rho_changes
        }
        return `<sub>${EnvChanges.rho_count}</sub>${EnvChanges.rho_changes}`;
    }

    static get xi() {
        return EnvChanges.xi_changes
    }

    static saveState(html) {
        if (html) {
            return {rho : EnvChanges.html_rho, xi: EnvChanges.xi};
        } 
        else {
            return {rho : EnvChanges.latex_rho, xi: EnvChanges.xi};
        }
    }

    static beforeFunCall() {
        EnvChanges.rho_changes = ""
        EnvChanges.rho_count++;
    }

    static afterFunCall(beforeChanges) {
        EnvChanges.rho_changes = beforeChanges
    }
    /**
     * 
     * @param {String} env : Either "xi", "rho", "ksee"
     * @param {String} name : Name of the variable
     * @param {Int} value : value of the variable
     * @param {Syntax} syntax 
     */
    static addMapToEnv(env, name, value, syntax) {
        let string = `${syntax.startBracket} ${name} ${syntax.mapsTo} ${value}`;
        if (env == "rho") [
            EnvChanges.rho_changes += string 
        ] 
        else {
            EnvChanges.xi_changes += string
        } 
    }
}

class Syntax {
    /**
     * 
     * @param {String} startBracket 
     * @param {String} endBracket 
     * @param {String} mapsTo 
     */
    constructor(startBracket, endBracket, mapsTo) {
        this.startBracket = startBracket;
        this.endBracket = endBracket;
        this.mapsTo = mapsTo;
    }

    static latexSyntax() {
        return new Syntax("\\{", "\\}", "\\mapsto");
    }

    static htmlSyntax() {
        return new Syntax("{", "}", "→");
    }
}

export {Syntax, EnvChanges}