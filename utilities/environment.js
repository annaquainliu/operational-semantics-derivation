
/**
 * 
 * @param {String} env : Either "xi", "rho", "ksee"
 * @param {JSON} obj : Either names -> Int, or names -> {parameters: [String], exp: String} 
 * @param {Syntax} syntax 
 * @returns 
 */
function translateEnvIntoWords(env, obj, syntax) {
    let string = "";
    if (env == "rho" || env == "xi") {
        if (env == "rho") [
            string += `${syntax.rho} = ${syntax.startBracket}`
        ] 
        else {
            string += `${syntax.xi} = ${syntax.startBracket}`
        } 
        let names = Object.keys(obj);
        for (let i = 0; i < names.length; i++) {
            string += names[i] + ` ${syntax.mapsTo} ` + obj[names[i]] + ", ";
        }
    } 
    else {
        string += `${syntax.phi} = ${syntax.startBracket}`
        let names = Object.keys(obj);
        for (let i = 0; i < names.length; i++) {
            const fun_name = names[i];
            const params = obj[fun_name].parameters;
            let param_string = "";
            if (params.length == 1) {
                param_string += params[0];
            }
            else if (params.length > 1) {
                param_string = `${params[0]}...${params[params.length - 1]}`;
            }
            string += `${fun_name} ${syntax.mapsTo} (${syntax.langle}${param_string}${syntax.rangle}, e${syntax.startSub}${fun_name}${syntax.endSub}), `;
        }
    }
    string = string.slice(0, -2);
    string += syntax.endBracket;
    return string;
}

class EnvChanges {

    constructor(xi, phi, rho_1, rho_2) {
        this.xi = xi;
        this.phi = phi;
        this.rho_1 = rho_1;
        this.rho_2 = rho_2;
    }
}

class Syntax {
    /**
     * 
     * @param {String} startBracket 
     * @param {String} endBracket 
     * @param {String} xi 
     * @param {String} rho 
     * @param {String} phi 
     * @param {String} mapsTo 
     * @param {String} startSub 
     * @param {String} endSub 
     * @param {String} langle
     * @param {String} rangle
     */
    constructor(startBracket, endBracket, xi, rho, phi, mapsTo, startSub, endSub, langle, rangle) {
        this.startBracket = startBracket;
        this.endBracket = endBracket;
        this.xi = xi;
        this.rho = rho;
        this.phi = phi;
        this.mapsTo = mapsTo;
        this.startSub = startSub;
        this.endSub = endSub;
        this.langle = langle;
        this.rangle = rangle;
    }
}

export default {translateEnvIntoWords, Syntax: Syntax, EnvChanges: EnvChanges};