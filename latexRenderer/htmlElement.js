class HtmlElement {

    //tag : string
    //style : JSON
    //children : [] HTMLElement
    //innerText : string
    constructor(tag, style, children, innerText) {
        this.tag = tag;
        this.style = style;
        this.children = children;
        this.innerText = innerText;
    }

    get html() {
        let childrenHTML = "";
        this.children.forEach(child => {
            childrenHTML += child.html;
        });
        return  `<${this.tag} style='${this.styleToText()}'>
                    ${this.innerText}
                    ${childrenHTML}
                </${this.tag}>`;
    }

    editStyle(field, value) {
        this.style[field] = value;
    }

    nthChild(i) {
        return this.children[i];
    }

    addChild(htmlElement) {
        this.children.push(htmlElement);
    }

    addStyle(field, value) {
        this.style += `${field}: ${value};`;
    }

    styleToText() {
        let style = this.style;
        let text = '';
        for (const key in style) {
            text += `${key}: ${style[key]};`
        }
        return text;
    }

}

export default HtmlElement;