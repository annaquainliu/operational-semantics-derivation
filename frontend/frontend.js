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
        const name = nameField.value.toLowerCase().replaceAll(" ", "");
        const value = valueField.value;
        if (!isNaN(name)) {
            alert("You cannot name your variable a number!");
            return;
        }
        if (!isValidName(name, 'variable name') || !isValidName(value, 'variable value')) {
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
    const showParam = document.querySelector("#parameterDiv > button");
    const paramInfo = document.getElementById('parameter_info');
    const addParam = document.querySelector("#parameter_info > button");
    const functionBody = document.getElementById('functionBody');

    addVariables(addFunction, functionInfo); 
    addVariables(showParam, paramInfo);
    button.addEventListener('click', () => {
        const paramsValue = parameters.value.toLowerCase();
        const expValue = functionBody.value.toLowerCase();
        const nameString = name.value.replaceAll(' ', '');
        if (!isNaN(nameString)) {
            alert("You cannot name your function a number/empty!");
            return;
        }
        if (!isValidName(nameString, 'function name') || !isValidName(expValue, 'function body')) {
            return;
        }
        addMapToEnv(nameString, `<span>(${paramsValue})</span>
                                <input value='${expValue}' class='functionMap'></input>`, 
                    'phi');
    });
    addParam.addEventListener('click', () => {
        const paramInput = document.querySelector("#parameter_info input"); 
        const paramToAdd = paramInput.value.toLowerCase();
        if (!isNaN(paramToAdd)) {
            alert("You cannot name your parameter a number!");
            return;
        }
        if (!isValidName(paramToAdd, 'parameter')) {
            return;
        }
        const params = parameters.value.replaceAll(" ", "").split(',');
        for (let i = 0; i < params.length; i++) {
            if (params[i] == paramToAdd) {
                alert('All parameter names must be distinct');
                return;
            }
        }
        if (parameters.value == "") {
            parameters.value = paramToAdd;
        } else {
            parameters.value += `, ${paramToAdd}`;
        }
    });
}   

function addVariables(addVariable, variableInfo) {
    addVariable.addEventListener('click', () => {
        if (variableInfo.style.display == "none" || variableInfo.style.display == "") {
            variableInfo.style.display = "flex";
        } else {
            variableInfo.style.display = "none";
        }
    });
}

function addMapToEnv(name, value, env) {
    if (!isValidName(name, 'variable/function')) {
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


function isValidName(name, description) {
    if (name == "") {
        alert(`Your ${description} cannot be empty!`);
        return false;
    }
    if (name.startsWith("$")) {
        alert(`You cannot start your ${description} with a '$'.`);
        return false;
    }
    if (invalidWords.includes(name)) {
        alert(`You cannot name your ${description} '${name}', as it is an Impcore keyword.`);
        return false;
    }
    return true;
}