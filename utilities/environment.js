

/**
 * Static class that records the changes of environments rho and xi
 */
class EnvChanges {
    static rho_changes = ""
    static xi_changes = ""
    static rho_count = 0
    static curr_rho_count = 0

    static reset() {
        EnvChanges.rho_changes = ""
        EnvChanges.xi_changes = ""
        EnvChanges.rho_count = 0
        EnvChanges.curr_rho_count = 0
    }

    static get latex_rho() {
        if (EnvChanges.curr_rho_count == 0) {
            return EnvChanges.rho_changes
        }
        return `_{${EnvChanges.curr_rho_count}}${EnvChanges.rho_changes}`;
    }

    static get html_rho() {
        if (EnvChanges.curr_rho_count == 0) {
            return EnvChanges.rho_changes
        }
        return `<sub>${EnvChanges.curr_rho_count}</sub>${EnvChanges.rho_changes}`;
    }

    static get xi() {
        return EnvChanges.xi_changes
    }

    static saveState(html) {
        if (html) {
            return {rho : EnvChanges.html_rho, xi: EnvChanges.xi, count: EnvChanges.rho_count, rho_changes: EnvChanges.rho_changes};
        } 
        else {
            return {rho : EnvChanges.latex_rho, xi: EnvChanges.xi, count: EnvChanges.rho_count, rho_changes: EnvChanges.rho_changes};
        }
    }

    static beforeFunCall() {
        EnvChanges.rho_changes = ""
        EnvChanges.rho_count++;
        EnvChanges.curr_rho_count = EnvChanges.rho_count;
    }

    static afterFunCall(beforeChanges) {
        EnvChanges.rho_changes = beforeChanges.rho_changes
        EnvChanges.curr_rho_count--;
    }
    /**
     * 
     * @param {String} env : Either "xi", "rho", "ksee"
     * @param {String} name : Name of the variable
     * @param {Int} value : value of the variable
     * @param {Boolean} html : Html or Latex rendering
     */
    static addMapToEnv(env, name, value, html) {
        let string = html ? `{${name} → ${value}}` : `\\{ ${name} \\mapsto ${value} \\}`;
        if (env == "rho") {
            EnvChanges.rho_changes += string 
        }
        else {
            EnvChanges.xi_changes += string
        } 
    }
}


export {EnvChanges}