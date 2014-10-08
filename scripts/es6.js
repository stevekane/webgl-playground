var es6      = require("es6-transpiler")
var fileName = process.argv[2]
var output   = es6.run({filename: fileName}).src

process.stdout.write(output)
