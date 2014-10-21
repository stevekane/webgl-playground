var path       = require('path')
var fs         = require('fs')
var browserify = require('browserify')
var fileName   = process.argv[2]
var targetPath = path.join("..", fileName)
var bundlePath = path.join("public", "benchmarks.js")

browserify({debug: true})
  .require(require.resolve(targetPath), { entry: true })
  .bundle()
  .on('error', function (err) { console.error(err); })
  .pipe(fs.createWriteStream(bundlePath))
