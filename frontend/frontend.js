const variables = document.getElementsByClassName('variable');

Array.prototype.forEach.call(variables, variableDiv => {
    const variableInfo = variableDiv.getElementsByClassName('variable_info')[0];
    const addVariable = variableDiv.getElementsByClassName('add_variable')[0];
    const button = variableDiv.getElementsByTagName('button')[0];
    const env = variableDiv.getAttribute('value');
    const nameField = variableDiv.querySelector("input[name='name']");
    const valueField = variableDiv.querySelector("input[name='value']");

    addVariable.addEventListener('click', () => {
        if (variableInfo.style.opacity == "0" || variableInfo.style.opacity == "") {
            variableInfo.style.opacity = "1";
        } else {
            variableInfo.style.opacity = "0";
        }
        console.log( variableInfo.style);
    });
    //add variable
    button.addEventListener('click', () => {
        const name = nameField.value.replaceAll(" ", "");
        const value = valueField.value;
        if (name == "" || value == "") {
            alert("Please fill in the name and the value of the variable");
            return;
        }
        if (!isValidName(name)) {
            return;
        }
        const mapping = document.getElementById(env);
        const map = makeMapDiv(name, parseInt(value), mapping, env);
        mapping.appendChild(map);
    });
});

function makeMapDiv(name, value, parent, env) {
    const div = document.createElement('div');
    div.className = "map map-" + env;
    const varAndValue = document.createElement('span');
    varAndValue.className = "varAndvalue";
    varAndValue.innerText = `${name} → ${value}`;
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
    let invalidWords = ['begin', 'if', 'set', 'while', 'val', '+', '-', "/", "=", "*", "||", "&&", "mod"];
    if (invalidWords.includes(name)) {
        alert(`You cannot name your variable '${name}', as it is an Impcore keyword.`);
        return false;
    }
    return true;
}