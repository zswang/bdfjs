var BDF = require('../');

describe("src/bdf.js", function () {
  var assert = require('should');
  var util = require('util');
  var examplejs_printLines;
  function examplejs_print() {
    examplejs_printLines.push(util.format.apply(util, arguments));
  }

  it("parse():default", function() {
    examplejs_printLines = [];
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer);

    examplejs_print(font.meta.name);
    assert.equal(examplejs_printLines.join("\n"), "-Misc-Fixed-Medium-R-Normal--6-60-75-75-C-40-ISO10646-1"); examplejs_printLines = [];

    examplejs_print(JSON.stringify(font.glyphs[33].bytes));
    assert.equal(examplejs_printLines.join("\n"), "[64,64,64,0,64,0]"); examplejs_printLines = [];
  });
  it("parse():{ onlymeta: true }", function() {
    examplejs_printLines = [];
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer, { onlymeta: true });

    examplejs_print(font.meta.name);
    assert.equal(examplejs_printLines.join("\n"), "-Misc-Fixed-Medium-R-Normal--6-60-75-75-C-40-ISO10646-1"); examplejs_printLines = [];

    examplejs_print(JSON.stringify(font.glyphs));
    assert.equal(examplejs_printLines.join("\n"), "{}"); examplejs_printLines = [];
  });
  it("parse():{ allprops: true }", function() {
    examplejs_printLines = [];
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer, { allprops: true });

    examplejs_print(font.meta.properties.charsetRegistry);
    assert.equal(examplejs_printLines.join("\n"), "ISO10646"); examplejs_printLines = [];
  });
  it("draw():default", function() {
    examplejs_printLines = [];
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer);

    var bitmap = BDF.draw(font, 'HI');
    examplejs_print(JSON.stringify(BDF.trim(bitmap)));
    assert.equal(examplejs_printLines.join("\n"), "{\"0\":[1,0,1,0,1,1],\"1\":[1,0,1,0,0,1],\"2\":[1,1,1,0,0,1],\"3\":[1,0,1,0,0,1],\"4\":[1,0,1,0,1,1],\"width\":7,\"height\":5}"); examplejs_printLines = [];
  });
  it("trim():default", function() {
    examplejs_printLines = [];
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer);

    var bitmap = BDF.draw(font, 'HI');
    examplejs_print(JSON.stringify(BDF.trim(bitmap)));
    assert.equal(examplejs_printLines.join("\n"), "{\"0\":[1,0,1,0,1,1],\"1\":[1,0,1,0,0,1],\"2\":[1,1,1,0,0,1],\"3\":[1,0,1,0,0,1],\"4\":[1,0,1,0,1,1],\"width\":7,\"height\":5}"); examplejs_printLines = [];
  });
});