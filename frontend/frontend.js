const invalidWords = ['begin', 'if', 'set', 'while', 'val', '+', '-', "/", "=", "*", "||", "&&", "mod"];
const expression = document.getElementById('input');
addListenersForGlobal();
addListenersForFunction();

function addListenersForGlobal() {
    const variable = document.getElementById('addGlobal');
    const variableInfo = variable.getElementsByClassName('variable_info')[0];
    const addVariable = variable.getElementsByClassName('add_variable')[0];
    const button = variable.getElementsByTagName('button')[0];
    const env = 'xi';
    const nameField = variable.querySelector("input[name='name']");
    const valueField = variable.querySelector("input[name='value']");

    addVariables(addVariable, variableInfo);
    button.addEventListener('click', () => {
        const name = nameField.value.replaceAll(" ", "");
        const value = valueField.value;
        if (!fieldsNotEmpty(name, value)) {
            alert("Please fill out the name and value of the variable!");
            return;
        }
        addMapToEnv(name, value, env);
    });
}

function addListenersForFunction() {
    const addFunction = document.getElementById('addFunction');
    const functionInfo = document.getElementById("function_info");
    const button = document.querySelector("#function_info > button");
    const name = document.getElementById("function_name");
    const parameters = document.getElementById('parameters');

    addVariables(addFunction, functionInfo); 
    button.addEventListener('click', () => {
        if (!fieldsNotEmpty(name.value, expression.value)) {
            alert("Please fill out the name and the body of the function!");
            return;
        }
        if (!isValidName(name.value)) {
            return;
        }
        const params = parameters.value.replaceAll(" ", "").split(',');
        for (let i = 0; i < params.length; i++) {
            if (!isValidName(params[i])) {
                return;
            }
            const repeat = params.filter(value => value == params[i]);
            if (repeat.length > 1) {
                alert("All parameters must have distinct names!");
                return;
            }
        }
        const nameString = name.value.replaceAll(' ', '');
        addMapToEnv(nameString, `<span>(${parameters.value})</span>
                                <input value='${expression.value}' class='functionMap'></input>`, 
                    'phi');
    });
}   

function fieldsNotEmpty(name, value) {
    return name != "" && value != "";
}

function addVariables(addVariable, variableInfo) {
    addVariable.addEventListener('click', () => {
        if (addVariable.getAttribute('value') == 'phi') {
            expression.value = '';
        }
        if (variableInfo.style.display == "none" || variableInfo.style.display == "") {
            variableInfo.style.display = "flex";
        } else {
            variableInfo.style.display = "none";
        }
    });
}

function addMapToEnv(name, value, env) {
    if (!isValidName(name)) {
        return;
    }
    const mapping = document.getElementById(env);
    const map = makeMapDiv(name, value, mapping, env);
    mapping.appendChild(map);
}


function makeMapDiv(name, value, parent, env) {
    const div = document.createElement('div');
    div.className = "map " + env;
    const varAndValue = document.createElement('span');
    varAndValue.className = "varAndvalue";
    varAndValue.innerHTML = `${name} → ${value}`;
    const deleteDiv = document.createElement('span');
    deleteDiv.className = 'delete';
    deleteDiv.innerText = "x";
    div.append(varAndValue, deleteDiv);
    deleteDiv.addEventListener('click', () => {
       parent.removeChild(div);
    });
    return div;
}


function isValidName(name) {
    if (name.startsWith("$")) {
        alert(`You cannot start your variable name with a '$'.`);
        return false;
    }
    if (name != "" && !isNaN(name)) {
        alert("Your variable cannot be named a number!");
        return false;
    }
    if (invalidWords.includes(name)) {
        alert(`You cannot name your variable '${name}', as it is an Impcore keyword.`);
        return false;
    }
    return true;
}