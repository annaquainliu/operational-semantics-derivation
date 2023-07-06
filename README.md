# Operational Semantics Derivation Program

This program takes in any Impcore expression and receive its full derivation in Latex.

Made this for pure fun!

# Examples
Expression : `(if (set x 1) (if y x 45) 99)` 

Environments : `ρ = {x -> 1}`, `ξ = {y -> 13}`

Latex Output: 

`\begin{adjustbox}{width=\columnwidth,center}
$
\inferrule*[Right=\textsc{IfTrue}]{\inferrule*[Right=\textsc{FormalAssign}]{x \in dom \rho \and \inferrule*[Right=\textsc{Literal}]{\ }{\state{\textsc{Literal(1)}}{\xi}{\phi}{\rho}\Downarrow\state{1}{\xi}{\phi}{\rho}}}{\state{\textsc{Set(Var(x), Literal(1))}}{\xi}{\phi}{\rho} \Downarrow \state{1}{\xi}{\phi}{\rho\{x\mapsto1\}}} \and 1 \neq 0 \and \inferrule*[Right=\textsc{IfTrue}]{\inferrule*[Right=\textsc{GlobalVar}]{y \in dom \xi}{\state{\textsc{Var(y)}}{\xi}{\phi}{\rho'}\Downarrow\state{\xi(y)}{\xi}{\phi}{\rho'}} \and 13 \neq 0 \and \inferrule*[Right=\textsc{FormalVar}]{x \in dom \rho'}{\state{\textsc{Var(x)}}{\xi}{\phi}{\rho'}\Downarrow\state{\rho'(x)}{\xi}{\phi}{\rho'}}}{\state{\textsc{If(Var(y), Var(x), Literal(45))}}{\xi}{\phi}{\rho'} \Downarrow \state{1}{\xi}{\phi}{\rho'}}}{\state{\textsc{If(Set(Var(x), Literal(1)), If(Var(y), Var(x), Literal(45)), Literal(99))}}{\xi}{\phi}{\rho} \Downarrow \state{1}{\xi}{\phi}{\rho'}}
$
\end{adjustbox}`

Image of Output:

# Limitations

 This program does not allow the user to declare any functions (yet!).
