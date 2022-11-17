
const os = require('os');
const fs = require('fs');
const path = require('path');

let temp = fs.mkdtempSync(path.join(os.tmpdir(), 'com.m4k15y6666fk-'));
fs.linkSync(temp, path.join(__dirname, '.link'));
fs.writeFileSync(path.join(__dirname, '.link', 'test.txt'), 'test');

console.log(temp);
