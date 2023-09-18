# Operational Semantics Derivation Program

This **[website](https://annaquainliu.github.io/operational-semantics-derivation/)** hosts a JavaScript program that takes in any Impcore expression and outputs its full derivation in *Latex code* and in my own *HTML Latex renderer*!

Made this for pure fun! 😄

## What is Impcore?

Impcore is a functional programming language which consists of two types of statements : definitions and expressions. Impcore code is simply a list of definitions. For example, one type of definition is the declaration of a variable to hold an integer value, using the `val` keyword. *(The only value type that exists in Impcore is the integer type)*. 

**All definitions must be assigned one expression, and expressions can consist of nested expressions**.

Due to the recursive nature of Impcore's syntax, operational semantic derivations can create a recursive 'math expression' that explains the behavior of an Impcore expression. This program takes in an Impcore expression, and outputs the derivation in Latex syntax.

### Impcore Environments
Impcore stores variables in 3 different environments. 

The ξ environment stores global variables. The ρ environment stores local variables (function parameters). ξ and ρ store variables by mapping the name of each variable to its value.

**To define a variable with this website, press the + button next to the global or local environment**.

The last environment is the Φ environment, which stores functions by mapping the name of the function to its body (an expression).

### Impcore Expressions
There are 7 different types of Impcore expressions.

exp ::= 

       | integer - literal
       
       | variable - name
       
       | (set x exp) 
       
       | (if exp1 exp2 exp3)
       
       | (while exp1 exp2)
       
       | (begin exp1 ... expn)
       
       | (function-name exp1 ... expn)

### Available Impcore Primitive Functions
This program has implemented <, >, =, +, -, *, /, mod, &&, ||, != standard basis functions.

## Examples
Expression : `(if (set x 1) (if y x 45) 99)` 

Environments : `ρ = {x -> 1}`, `ξ = {y -> 13}`

Latex Output: 
`\documentclass[11pt]{article} \usepackage[T1]{fontenc} \usepackage{alltt} \usepackage{verbatim} \usepackage{hyperref} \usepackage{amsmath} \usepackage{amssymb} \usepackage{qtree} \usepackage{semantic} \usepackage{mathpartir} \usepackage{adjustbox} \begin{document} \newcommand{\br}[1]{\langle #1 \rangle}\newcommand{\state}[4]{\langle {#1,#2,#3,#4} \rangle}\newcommand{\evalr}[2][{}]{\state{#2}{\xi#1}{\phi}{\rho#1}}\begin{adjustbox}{width=\columnwidth,center}$\inferrule*[Right=\textsc{IfTrue}]{\inferrule*[Right=\textsc{GlobalAssign}]{x \notin dom(\rho) \and x \in dom(\xi) \and \inferrule*[Right=\textsc{Literal}]{ \ }{\state{\textsc{Literal(1)}}{\xi}{\phi}{\rho} \Downarrow \state{\textsc{1}}{\xi}{\phi}{\rho}}}{\state{\textsc{Set(x, Literal(1))}}{\xi}{\phi}{\rho} \Downarrow \state{\textsc{1}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho}} \and 1 \neq 0 \and \inferrule*[Right=\textsc{IfTrue}]{\inferrule*[Right=\textsc{GlobalVar}]{y \notin dom(\rho) \and y \in dom(\xi\{ x \mapsto 1 \})}{\state{\textsc{Var(y)}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho} \Downarrow \state{\textsc{13}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho}} \and 13 \neq 0 \and \inferrule*[Right=\textsc{GlobalVar}]{x \notin dom(\rho) \and x \in dom(\xi\{ x \mapsto 1 \})}{\state{\textsc{Var(x)}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho} \Downarrow \state{\textsc{1}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho}}}{\state{\textsc{If(Var(y), Var(x), Literal(45))}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho} \Downarrow \state{\textsc{1}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho}}}{\state{\textsc{If(Set(x, Literal(1)), If(Var(y), Var(x), Literal(45)), Literal(99))}}{\xi}{\phi}{\rho} \Downarrow \state{\textsc{1}}{\xi\{ x \mapsto 1 \}}{\phi}{\rho}}$\end{adjustbox}\end{document}`
Image of Latex Output:
<img width="937" alt="Screenshot 2023-09-18 at 6 52 47 PM" src="https://github.com/annaquainliu/operational-semantics-derivation/assets/103337005/d0a1ec9f-f829-42ad-bd3e-6b570dcd5151">

Image of HTML Output:
<img width="1439" alt="Screenshot 2023-09-18 at 6 50 27 PM" src="https://github.com/annaquainliu/operational-semantics-derivation/assets/103337005/788955d3-56aa-4767-a6d7-f69c342a5aa3">

## How to Read Opsem
The conditions for the all of rules are read from bottom to the top.
