// BDF.parse(text, options);
// BDF.draw(bdf, text, options);
(function(exportName) {
  'use strict';
  /**
   * @file bdfjs
   *
   * Simple library for reading Adobe Glyph Bitmap Distribution font Data
   * @author
   *   Victor Porof (<victor.porof@gmail.com>)
   *   erkkah (https://github.com/erkkah)
   *   zswang (http://weibo.com/zswang)
   * @version 0.0.8
   * @date 2016-07-25
   */
  var exports = exports || {};
  /*<function name="camelCase">*/
  /**
   * 将字符串转换为驼峰命名
   *
   * @param {String} text 字符串
   * @return {String} 返回驼峰字符串
   '''<example>'''
   * @example camelCase():base
    ```js
    console.log(jstrs.camelCase('box-width'));
    // > boxWidth
    ```
   * @example camelCase():Upper & _
    ```js
    console.log(jstrs.camelCase('BOX_WIDTH'));
    // > boxWidth
    ```
   * @example camelCase():First char is _
    ```js
    console.log(jstrs.camelCase('_BOX_WIDTH'));
    // > BoxWidth
    ```
   * @example camelCase():none
    ```js
    console.log(jstrs.camelCase('width'));
    // > width
    ```
   * @example camelCase():Number
    ```js
    console.log(JSON.stringify(jstrs.camelCase(123)));
    // > 123
    ```
   '''</example>'''
   */
  function camelCase(text) {
    if (!text || typeof text !== 'string') { // 非字符串直接返回
      return text;
    }
    var result = text.toLowerCase();
    if (text.indexOf('_') >= 0 || text.indexOf('-') >= 0) {
      result = result.replace(/[-_]+([a-z])/ig, function (all, letter) {
        return letter.toUpperCase();
      });
    }
    return result;
  }
  /*</function>*/
  /*<function name="bdf_parse" depend="camelCase">*/
  /**
   * 解析 BDF 文本
   *
   * @param {String|Buffer} text BDF 文本
   * @param {Object} options 配置项
   * @param {Object} options.onlymeta 只解析描述部分
   * @return {Object} 返回描述和点阵数据
   * @example parse():default
    ```js
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer);
    console.log(font.meta.name);
    // > -Misc-Fixed-Medium-R-Normal--6-60-75-75-C-40-ISO10646-1
    console.log(JSON.stringify(font.glyphs[33].bytes));
    // > [64,64,64,0,64,0]
    ```
   * @example parse():{ onlymeta: true }
    ```js
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer, { onlymeta: true });
    console.log(font.meta.name);
    // > -Misc-Fixed-Medium-R-Normal--6-60-75-75-C-40-ISO10646-1
    console.log(JSON.stringify(font.glyphs));
    // > {}
    ```
   * @example parse():{ allprops: true }
    ```js
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer, { allprops: true });
    console.log(font.meta.properties.charsetRegistry);
    // > ISO10646
    ```
   */
  function bdf_parse(text, options) {
    options = options || {};
    var meta = {};
    var glyphs = {};
    var result = {
      meta: meta,
      glyphs: glyphs,
    };
    var fontLines = String(text).split(/\r?\n/);
    var declarationStack = [];
    var currentChar = null;
    for (var i = 0; i < fontLines.length; i++) {
      var line = fontLines[i];
      var data = line.split(/\s+/);
      var declaration = data[0];
      switch (declaration) {
        case "STARTFONT":
          declarationStack.push(declaration);
          meta.version = data[1];
          break;
        case "FONT":
          meta.name = data[1];
          break;
        case "SIZE":
          meta.size = {
            points: +data[1],
            resolutionX: +data[2],
            resolutionY: +data[3]
          };
          break;
        case "FONTBOUNDINGBOX":
          meta.boundingBox = {
            width: +data[1],
            height: +data[2],
            x: +data[3],
            y: +data[4]
          };
          break;
        case "STARTPROPERTIES":
          declarationStack.push(declaration);
          meta.properties = {};
          break;
        case "FONT_DESCENT":
          meta.properties.fontDescent = +data[1];
          break;
        case "FONT_ASCENT":
          meta.properties.fontAscent = +data[1];
          break;
        case "DEFAULT_CHAR":
          meta.properties.defaultChar = +data[1];
          break;
        case "ENDPROPERTIES":
          declarationStack.pop();
          if (options.onlymeta) {
            i = Number.MAX_VALUE; // break for
            declarationStack = [];
          }
          break;
        case "CHARS":
          meta.totalChars = +data[1];
          break;
        case "STARTCHAR":
          declarationStack.push(declaration);
          currentChar = {
            name: data[1],
            bytes: [],
            bitmap: []
          };
          break;
        case "ENCODING":
          currentChar.code = +data[1];
          currentChar.char = String.fromCharCode(+data[1]);
          break;
        case "SWIDTH":
          currentChar.scalableWidthX = +data[1];
          currentChar.scalableWidthY = +data[2];
          break;
        case "DWIDTH":
          currentChar.deviceWidthX = +data[1];
          currentChar.deviceWidthY = +data[2];
          break;
        case "BBX":
          currentChar.boundingBox = {
            x: +data[3],
            y: +data[4],
            width: +data[1],
            height: +data[2]
          };
          break;
        case "BITMAP":
          var bytesPerLine = Math.ceil(currentChar.boundingBox.width / 8);
          for (var row = 0; row < currentChar.boundingBox.height; row++, i++) {
            var bytesLine = fontLines[i + 1];
            currentChar.bitmap[row] = [];
            for (var byteIndex = 0; byteIndex < bytesPerLine; byteIndex++) {
              var byteString = bytesLine.substr(byteIndex * 2, 2);
              var byte = parseInt(byteString, 16);
              currentChar.bytes.push(byte);
              for (var bit = 7; bit >= 0; bit--) {
                currentChar.bitmap[row][(byteIndex * 8) + (7 - bit)] = byte & (1 << bit) ? 1 : 0;
              }
            }
          }
          break;
        case "ENDCHAR":
          declarationStack.pop();
          glyphs[currentChar.code] = currentChar;
          currentChar = null;
          break;
        case "ENDFONT":
          declarationStack.pop();
          break;
        default:
          if (options.allprops && declarationStack[declarationStack.length - 1] === 'STARTPROPERTIES') {
            var value = data.slice(1).join(' ').replace(/^"(.*)"$/, '$1');
            if (!isNaN(value)) {
              value = +value;
            }
            meta.properties[camelCase(declaration)] = value;
          }
          break;
      }
    }
    if (declarationStack.length) {
      throw "Couldn't correctly parse font";
    }
    return result;
  }
  /*</function>*/
  exports.parse = bdf_parse;
  /*<function name="bdf_draw">*/
  /**
   * 获取文字的点阵数据
   *
   * @param {Object} font 字体数据
   * @param {String} text 文本
   * @param {Object=} options 配置项
   * @param {Number=} options.kerningBias 字距调整偏差，默认: 0
   * @return {Object} 返回点阵数据
   * @example draw():default
    ```js
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer);
    var bitmap = BDF.draw(font, 'HI');
    console.log(JSON.stringify(bitmap));
    // > {"0":[1,0,1,0,1,1,1,0],"1":[1,0,1,0,0,1,0,0],"2":[1,1,1,0,0,1,0,0],"3":[1,0,1,0,0,1,0,0],"4":[1,0,1,0,1,1,1,0],"5":[0,0,0,0,0,0,0,0],"width":8,"height":6}
    ```
   */
  function bdf_draw(font, text, options) {
    if (!font || !text) {
      return;
    }
    options = options || {};
    var kerningBias = options.kerningBias || 0;
    var height = font.meta.boundingBox.height;
    var yoffset = font.meta.boundingBox.y;
    var baseline = (height + yoffset);
    // Current horizontal position in the destination bitmap
    var xpos = 0;
    var result = {
      width: 0,
      height: height
    };
    result.width = 0;
    result.height = height;
    for (var row = 0; row < height; row++) {
      result[row] = [];
    }
    for (var i = 0; i < text.length; i++) {
      var charCode = text[i].charCodeAt(0);
      var glyphData = font.glyphs[charCode];
      // Replace missing characters with:
      // 1: default char
      // 2: '?'
      // 3: the first character in the font
      if (!glyphData) {
        charCode = font.meta.properties.defaultChar;
        glyphData = font.glyphs[charCode];
      }
      if (!glyphData) {
        charCode = "?".charCodeAt(0);
        glyphData = font.glyphs[charCode];
      }
      if (!glyphData) {
        var keys = Object.keys(font.glyphs);
        glyphData = font.glyphs[keys[0]];
      }
      // Index into the destination bitmap for the top row of the font
      var rowStart = (baseline - glyphData.boundingBox.y - glyphData.boundingBox.height);
      // This character will need this many columns
      var columnsToAdd = Math.max(glyphData.deviceWidthX, glyphData.boundingBox.width);
      // Make room for offset bounding box, adjust xpos accordingly
      if (result.width < -glyphData.boundingBox.x) {
        xpos = -glyphData.boundingBox.x;
        columnsToAdd += xpos;
      }
      columnsToAdd += kerningBias;
      // Extend bitmap to the right with zeros
      for (var row1 = 0; row1 < height; row1++) {
        for (var glyphColumn = 0; glyphColumn < columnsToAdd; glyphColumn++) {
          column = glyphColumn + result.width;
          result[row1][column] = 0;
        }
      }
      result.width += columnsToAdd;
      // Draw the glyph
      for (var y = 0; y < glyphData.boundingBox.height; y++) {
        for (var x = 0; x < glyphData.boundingBox.width; x++) {
          var row2 = rowStart + y;
          var column = xpos + glyphData.boundingBox.x + x;
          result[row2][column] |= glyphData.bitmap[y][x];
        }
      }
      // Advance position
      xpos += glyphData.deviceWidthX + kerningBias;
    }
    return result;
  }
  /*</function>*/
  exports.draw = bdf_draw;
  /*<function name="bdf_trim">*/
  /**
   * 裁剪空白的边缘
   *
   * @param {Object} bitmap 点阵数据
   * @return {Object} 返回裁剪后的点阵数据
   * @example trim():default
    ```js
    var fs = require('fs');
    var path = require('path');
    var buffer = fs.readFileSync(path.join(__dirname, '../fonts/x11/4x6.bdf'));
    var font = BDF.parse(buffer);
    var bitmap = BDF.draw(font, 'HI');
    console.log(JSON.stringify(BDF.trim(bitmap)));
    // > {"0":[1,0,1,0,1,1,1],"1":[1,0,1,0,0,1,0],"2":[1,1,1,0,0,1,0],"3":[1,0,1,0,0,1,0],"4":[1,0,1,0,1,1,1],"width":7,"height":5}
    ```
   */
  function bdf_trim(bitmap) {
    var result = {
      width: bitmap.width,
      height: bitmap.height,
    };
    var minX = bitmap.width - 1;
    var maxX = 0;
    var minY = bitmap.height - 1;
    var maxY = 0;
    for (var y = 0; y < bitmap.height; y++) {
      var firstX = bitmap[y].indexOf(1);
      if (firstX >= 0) {
        var lastX = bitmap[y].lastIndexOf(1);
        maxY = Math.max(maxY, y);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, lastX);
        minX = Math.min(minX, firstX);
      }
    }
    result.width = maxX - minX + 1;
    result.height = maxY - minY + 1;
    for (var y1 = minY; y1 <= maxY; y1++) {
      result[y1 - minY] = bitmap[y1].slice(minX, maxX + 1);
    }
    return result;
  }
  exports.trim = bdf_trim;
  /*</function>*/
  if (typeof define === 'function') {
    if (define.amd) {
      define(function() {
        return exports;
      });
    }
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = exports;
  } else {
    window[exportName] = exports;
  }
})('BDF');