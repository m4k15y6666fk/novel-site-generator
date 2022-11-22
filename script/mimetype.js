const path = require('path');
const fs = require('fs');
const glob = require('glob');

const magic = require(path.join(__dirname, 'magic.js'));

let mimetype_dir = path.join(path.parse(__dirname).dir, 'mime-type');


let data = [];
for (let csv of glob.sync(path.join(mimetype_dir, '*.csv'))) {
    let partial = fs.readFileSync(csv).toString();

    let pre = [];
    for (let line of partial.split('\n')) {
        pre.push(line.split(',').slice(0,2));
    }

    data = Object.assign(data, pre.slice(1));
}

function searchIANA(str) {
    let ext = path.parse(str).ext;
    ext = ext.slice(ext.indexOf('.') + 1);

    let result = '';
    for (let line of data) {
        if (line[0] == ext) {
            result = line[1];
            break;
        }
    }

    return result;
}

function mimetype(str) {
    let buffer = fs.readFileSync(str);

    let result = {
        type: magic(buffer),
        buffer: buffer
    }

    if (result.type.length == 0) {
        result.type = searchIANA(str);
    }

    return result;
}

module.exports = mimetype;
