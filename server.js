var http    = require("http");
var express = require("express")
var jade    = require("jade")

var app        = express()
var httpServer = http.Server(app)

app.engine("jade", jade.__express);
app.set("view engine", "jade");
app.set("views", __dirname + "/templates");
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/:name", function (req, res) {
  res.render("example", {name: req.params.name})
})
       

httpServer.listen(4000, console.log.bind(console, "connected on 4000"));
