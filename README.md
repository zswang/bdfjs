bdfjs
======

# [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url]

Simple library for reading Adobe Glyph Bitmap Distribution font data.

Read more about this format on [Wikipedia](https://en.wikipedia.org/wiki/Glyph_Bitmap_Distribution_Format).

## Install

`npm install bdfjs`

## How to use

```js
var fs = require('fs');
var font = BDF.parse(fs.readFileSync('c64.bfd'));
var bitmap = BDF.draw(font, 'hello');
console.log(bitmap);
```

[npm-url]: https://npmjs.org/package/bdfjs
[npm-image]: https://badge.fury.io/js/bdfjs.svg
[travis-url]: https://travis-ci.org/zswang/bdfjs
[travis-image]: https://travis-ci.org/zswang/bdfjs.svg?branch=master
[coverage-url]: https://coveralls.io/github/zswang/bdfjs?branch=master
[coverage-image]: https://coveralls.io/repos/zswang/bdfjs/badge.svg?branch=master&service=github
