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

![image (1)](https://github.com/annaquainliu/operational-semantics-derivation/assets/103337005/e062ad76-5c47-44a3-8155-20853186d2d3)

# Limitations

This program does not implement the `while` function in Impcore, as the Latex derivation would be unreadable.

Additionally, this program does not allow declaring any functions or the use of any Impcore standard basis functions. 
