var path       = require('path')
var fs         = require('fs')
var browserify = require('browserify')
var fileName   = process.argv[2]
var targetPath = path.join("..", "src", "examples", fileName)
var bundlePath = path.join("public", "examples", fileName)

browserify({debug: true})
  .require(require.resolve(targetPath), { entry: true })
  .external("async")
  .bundle()
  .on('error', function (err) { console.error(err); })
  .pipe(fs.createWriteStream(bundlePath))
