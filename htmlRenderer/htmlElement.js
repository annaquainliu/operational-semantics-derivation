class HtmlElement {

    static fontSize = '20px';
    /**
     * 
     * @param {String} tag 
     * @param {JSON} style 
     * @param {Array<HtmlElement>} children 
     * @param {String} innerText 
     * @param {JSON} additionalAttr 
     */
    constructor(tag, style, children, innerText, additionalAttr) {
        this.tag = tag;
        this.style = style;
        this.children = children;
        this.innerText = innerText;
        this.additionalAttr = additionalAttr;
    }

    static space() {
        return new HtmlElement('div', {}, [], '&nbsp;', {});
    }

    static empty() {
        return new HtmlElement('div', {}, [], '', {});
    }

    static text(text) {
        return new HtmlElement('span', {}, [], text, {});
    }

    static conditionText(text, orientation) {
        let alignSelf = 'flex-end';
        if (orientation == 'column') {
            alignSelf = 'center';
        }
        const style = {'white-space': 'nowrap', 'align-self' : alignSelf, 'padding-left' : '1vw', 'padding-right' : '1vw'};
        return new HtmlElement('div', style, [], text, {});
    }

    get html() {
        let childrenHTML = "";
        this.children.forEach(child => {
            childrenHTML += child.html;
        });
        let additional = ``;
        for (const [attr, value] of Object.entries(this.additionalAttr)) {
            additional += `${attr}="${value}"; `;
        }
        return  `<${this.tag} style='${this.styleToText()}' ${additional}>
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