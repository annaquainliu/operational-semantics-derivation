# Operational Semantics Derivation Program

This program takes in any Impcore expression and outputs its full derivation in Latex.

Made this for pure fun! 😄

## What is Impcore?

Impcore is a functional programming language which consists of two types of statements : definitions and expressions. Impcore code is simply a list of definitions. One way to create a definition is with the keyword `val`, which declares a value *(The only value type that exists in Impcore is the integer type)*. 

**All definitions must be assigned one expression, and expressions can consist of nested expressions**.

For the scope of this project, this program allows users to create Impcore expressions and define variables, but does not allow users to define functions *(yet!)*.

Due to the recursive nature of Impcore's syntax, operational semantic derivations can create a recursive 'math expression' that explains the behavior of an Impcore expression. This program takes in an Impcore expression, and outputs the derivation in Latex syntax.

## Impcore Environments
Impcore stores variables in 3 different environments. 

The ξ environment stores global variables. The ρ environment stores local variables (function parameters). ξ and ρ store variables by mapping the name of each variable to its value.

The last environment is the Φ environment, which stores functions by mapping the name of the function to its body (an expression).

## Impcore Expressions
There are 7 different types of Impcore expressions.

exp ::= integer-literal 
       | variable-name
       | (set x exp) 
       | (if exp1 exp2 exp3)
       | (while exp1 exp2)
       | (begin exp1 ... expn)
       | (function-name exp1 ... expn)

## Examples
Expression : `(if (set x 1) (if y x 45) 99)` 

Environments : `ρ = {x -> 1}`, `ξ = {y -> 13}`

Latex Output: 
`\begin{adjustbox}{width=\columnwidth,center}
$
\inferrule*[Right=\textsc{IfTrue}]{\inferrule*[Right=\textsc{FormalAssign}]{x \in dom \rho \and \inferrule*[Right=\textsc{Literal}]{\ }{\state{\textsc{Literal(1)}}{\xi}{\phi}{\rho}\Downarrow\state{1}{\xi}{\phi}{\rho}}}{\state{\textsc{Set(Var(x), Literal(1))}}{\xi}{\phi}{\rho} \Downarrow \state{1}{\xi}{\phi}{\rho\{x\mapsto1\}}} \and 1 \neq 0 \and \inferrule*[Right=\textsc{IfTrue}]{\inferrule*[Right=\textsc{GlobalVar}]{y \notin dom \rho' \and y \in dom \xi}{\state{\textsc{Var(y)}}{\xi}{\phi}{\rho'}\Downarrow\state{\xi(y)}{\xi}{\phi}{\rho'}} \and 13 \neq 0 \and \inferrule*[Right=\textsc{FormalVar}]{x \in dom \rho'}{\state{\textsc{Var(x)}}{\xi}{\phi}{\rho'}\Downarrow\state{\rho'(x)}{\xi}{\phi}{\rho'}}}{\state{\textsc{If(Var(y), Var(x), Literal(45))}}{\xi}{\phi}{\rho'} \Downarrow \state{1}{\xi}{\phi}{\rho'}}}{\state{\textsc{If(Set(Var(x), Literal(1)), If(Var(y), Var(x), Literal(45)), Literal(99))}}{\xi}{\phi}{\rho} \Downarrow \state{1}{\xi}{\phi}{\rho'}}
$
\end{adjustbox}`

Image of Output:

![image (3)](https://github.com/annaquainliu/operational-semantics-derivation/assets/103337005/1a1fd150-860c-4ab2-8c2a-e99c14fc7839)

## Limitations

 This program does not allow the user to declare any functions (yet!).
