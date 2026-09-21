'use strict';
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderAssets() {
    const sourceAssets = upath.resolve(upath.dirname(__filename), '../src/assets');
    const destPath = upath.resolve(upath.dirname(__filename), '../dist/.');
    sh.cp('-R', sourceAssets, destPath);

    const sourceData = upath.resolve(upath.dirname(__filename), '../src/data');
    const destData = upath.resolve(upath.dirname(__filename), '../dist/data');
    sh.mkdir('-p', destData);
    sh.cp('-R', sourceData + '/*', destData);
};
