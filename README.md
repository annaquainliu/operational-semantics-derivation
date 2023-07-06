# Operational Semantics Derivation Program

This program takes in any Impcore expression and outputs its full derivation in Latex.

Made this for pure fun!

# Examples
Expression : `(if (set x 1) (if y x 45) 99)` 

Environments : `ρ = {x -> 1}`, `ξ = {y -> 13}`

Latex Output: 


Image of Output:

# Limitations

 This program does not allow the user to declare any functions (yet!).
