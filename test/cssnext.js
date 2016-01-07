var tape = require("tape")
var gutil = require("gulp-util")
var through2 = require("through2")
var cssnext = require("..")

var fs = require("fs")
var path = require("path")

function read(file, encoding) {
  return fs.readFileSync(path.resolve(__dirname, file), encoding)
}

tape("cssnext", function(test) {
  var stream = cssnext()
  var file = new gutil.File({
    base: ".",
    path: ".",
    contents: read("fixtures/index.css"),
  })

  stream.on("data", function(data) {
    test.equal(data.contents.toString(), read("expected/index.css", "utf8"))
    test.end()
  })
  stream.end(file)
})

tape("cssnext throws if stream", function(test) {
  var stream = cssnext()
  var file = new gutil.File({
    base: ".",
    path: ".",
    contents: through2(),
  })
  stream.on("error", function(err) {
    test.equal(err.message, "streaming not supported")
    test.equal(err instanceof gutil.PluginError, true)
    test.end()
  })
  stream.end(file)
})

tape("throws on cssnext error", function(test) {
  var stream = cssnext()
  var file = new gutil.File({
    base: ".",
    path: ".",
    contents: new Buffer(
      fs.readFileSync(
        path.resolve(__dirname, "fixtures/error.css"),
        {encoding: "utf8"}
      )
    ),
  })
  stream.on("error", function(err) {
    test.equal(err.message, path.resolve(".") + ":2:13: Unclosed bracket")
    test.equal(err instanceof gutil.PluginError, true)
    test.end()
  })
  stream.end(file)
})

tape(
  "Resolves relative paths for consecutive files in different paths",
  function(test) {
    test.plan(4)

    function testTwoFiles(options) {
      var stream = cssnext(options)

      var file1 = new gutil.File({
        base: "./test/fixtures/",
        path: "./test/fixtures/import.css",
        contents: read("fixtures/import.css"),
      })

      var file2 = new gutil.File({
        base: "./test/fixtures/import/",
        path: "./test/fixtures/import/index.css",
        contents: read("fixtures/import/index.css"),
      })

      stream.on("data", function(data) {
        var expected = read("expected/index.css", "utf8")
        test.equal(data.contents.toString(), expected)
      })

      stream.write(file1)
      stream.end(file2)
    }

    testTwoFiles()
    testTwoFiles({})
  }
)
