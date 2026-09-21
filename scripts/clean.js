const sh = require('shelljs');
const upath = require('upath');

const destPath = upath.resolve(upath.dirname(__filename), '../dist');

sh.mkdir('-p', destPath);
sh.find(destPath).forEach(file => {
    if (file === destPath || file === upath.join(destPath, 'img')) return;
    sh.rm('-rf', file);
});
